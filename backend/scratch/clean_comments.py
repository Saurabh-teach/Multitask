import tokenize
import io
import os

def remove_comments_and_docstrings(source):
    """
    Removes Python comments and docstrings from a source string.
    """
    io_obj = io.StringIO(source)
    out = ""
    prev_toktype = tokenize.INDENT
    last_lineno = -1
    last_col = 0
    
    tokens = tokenize.generate_tokens(io_obj.readline)
    for toktype, ttext, (slineno, scol), (elineno, ecol), ltext in tokens:
        if slineno > last_lineno:
            last_col = 0
        if scol > last_col:
            out += " " * (scol - last_col)
        
        if toktype == tokenize.COMMENT:
            pass
        elif toktype == tokenize.STRING:
            # Check if it is a docstring
            if prev_toktype == tokenize.INDENT or prev_toktype == tokenize.NEWLINE or prev_toktype == tokenize.NL:
                pass
            else:
                out += ttext
        else:
            out += ttext
        
        prev_toktype = toktype
        last_lineno = elineno
        last_col = ecol
    
    return out

def process_file(path):
    print(f"Processing {path}...")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Simple removal for non-complex files or if tokenize fails
        # I'll use a simpler approach because tokenize can be picky about line endings
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            # Skip lines that are only comments
            if line.strip().startswith('#'):
                continue
            # Remove inline comments (simple version)
            if ' # ' in line:
                line = line.split(' # ')[0].rstrip()
            elif line.strip().endswith('#'):
                # Handle cases like "import os #"
                line = line.rstrip('#').rstrip()
            
            new_lines.append(line)
        
        # Remove empty lines if multiple in a row
        final_lines = []
        prev_empty = False
        for line in new_lines:
            if not line.strip():
                if not prev_empty:
                    final_lines.append(line)
                    prev_empty = True
            else:
                final_lines.append(line)
                prev_empty = False
                
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(final_lines) + '\n')
            
    except Exception as e:
        print(f"Error processing {path}: {e}")

files = [
    'accounts/views.py',
    'accounts/models.py',
    'accounts/urls.py',
    'accounts/serializers.py',
    'backend/urls.py',
    'backend/settings.py',
    'backend/asgi.py',
    'backend/wsgi.py',
    'manage.py',
    'seed_saurabh.py'
]

for f in files:
    if os.path.exists(f):
        process_file(f)
