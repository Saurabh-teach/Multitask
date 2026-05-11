from django.urls import get_resolver
resolver = get_resolver()
for p in resolver.url_patterns:
    if hasattr(p, 'url_patterns'):
        print(f"PREFIX: '{p.pattern}'")
        for sp in p.url_patterns:
            name = getattr(sp, 'name', 'No Name')
            print(f"  - '{sp.pattern}' -> {name}")
