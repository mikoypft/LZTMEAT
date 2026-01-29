#!/usr/bin/env python3
"""
Migration script to replace all kv operations with kvWithRetry
This adds automatic retry logic to handle connection reset errors
"""

import re
import sys

def migrate_file(filepath):
    print(f"Reading {filepath}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"ERROR: File not found: {filepath}")
        return False
    
    original_content = content
    replacements = 0
    
    # Replace all kv operations with kvWithRetry
    patterns = [
        (r'await kv\.get\(', 'await kvWithRetry.get(', 'get'),
        (r'await kv\.set\(', 'await kvWithRetry.set(', 'set'),
        (r'await kv\.del\(', 'await kvWithRetry.del(', 'del'),
        (r'await kv\.mget\(', 'await kvWithRetry.mget(', 'mget'),
        (r'await kv\.mset\(', 'await kvWithRetry.mset(', 'mset'),
        (r'await kv\.getByPrefix\(', 'await kvWithRetry.getByPrefix(', 'getByPrefix'),
    ]
    
    print("\nApplying replacements...")
    for pattern, replacement, name in patterns:
        count = len(re.findall(pattern, content))
        if count > 0:
            content = re.sub(pattern, replacement, content)
            print(f"  ✓ Replaced {count} instances of 'kv.{name}(' with 'kvWithRetry.{name}('")
            replacements += count
    
    if replacements == 0:
        print("\n⚠️  No replacements needed - file already migrated or no kv calls found")
        return True
    
    print(f"\n✅ Total replacements: {replacements}")
    
    # Write back to file
    print(f"\nWriting changes to {filepath}...")
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ File updated successfully!")
        return True
    except Exception as e:
        print(f"ERROR writing file: {e}")
        return False

if __name__ == '__main__':
    filepath = '/tmp/sandbox/supabase/functions/server/index.tsx'
    
    print("=" * 60)
    print("KV to kvWithRetry Migration Script")
    print("=" * 60)
    print()
    
    success = migrate_file(filepath)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\nAll kv operations now use retry logic for better reliability")
        print("Connection reset errors will be automatically retried up to 3 times")
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ MIGRATION FAILED")
        print("=" * 60)
        sys.exit(1)