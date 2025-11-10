from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection
from players.models import Category
from players.models import Player
import re


def normalize_key(name):
    if not name:
        return None
    return re.sub(r"\s+", "", str(name)).strip().lower()


class Command(BaseCommand):
    help = 'Merge duplicate categories by normalized_name.\n\nUsage: python manage.py merge_categories [--dry-run] [--choose=policy]\nPolicies: oldest (default), newest, lowest_id'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', dest='dry_run', help='Do not modify DB; show actions')
        parser.add_argument('--policy', type=str, dest='policy', default='oldest', help='Policy to pick canonical category: oldest|newest|lowest_id')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        policy = options.get('policy', 'oldest')
        # Build mapping of normalized_key -> list of categories
        cats = list(Category.objects.all())
        groups = {}
        for c in cats:
            key = normalize_key(c.name if c.name is not None else c.normalized_name)
            if not key:
                continue
            groups.setdefault(key, []).append(c)

        # identify groups with >1 category
        dup_groups = {k: v for k, v in groups.items() if len(v) > 1}
        if not dup_groups:
            self.stdout.write(self.style.SUCCESS('No duplicate categories found.'))
            return

        self.stdout.write(f'Found {len(dup_groups)} duplicate category groups')
        for key, items in dup_groups.items():
            # choose canonical by policy
            if policy == 'oldest':
                items_sorted = sorted(items, key=lambda x: x.created_at if hasattr(x, 'created_at') else x.id)
            elif policy == 'newest':
                items_sorted = sorted(items, key=lambda x: x.created_at if hasattr(x, 'created_at') else x.id, reverse=True)
            elif policy == 'lowest_id':
                items_sorted = sorted(items, key=lambda x: x.id)
            else:
                items_sorted = sorted(items, key=lambda x: x.id)

            canonical = items_sorted[0]
            duplicates = [c for c in items_sorted[1:]]

            self.stdout.write(f'Group: {key} -> keep id={canonical.id} name="{canonical.name}"; duplicates: {[(d.id,d.name) for d in duplicates]}')

            if dry_run:
                continue

            # perform reassignments and deletes inside a transaction
            try:
                with transaction.atomic():
                    # reassign players pointing to duplicate categories
                    dup_ids = [d.id for d in duplicates]
                    if dup_ids:
                        Player.objects.filter(categoria_id__in=dup_ids).update(categoria_id=canonical.id)
                        # delete duplicate categories
                        Category.objects.filter(id__in=dup_ids).delete()
                        self.stdout.write(self.style.SUCCESS(f'Merged {len(dup_ids)} categories into {canonical.id}'))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Error merging group {key}: {e}'))

        self.stdout.write(self.style.SUCCESS('Merge complete.'))
