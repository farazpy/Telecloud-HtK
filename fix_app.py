import re

def fix_file(path):
    with open(path, 'r') as f:
        lines = f.readlines()

    fixed_lines = []
    for line in lines:
        # Fix missing opening quotes in ternaries
        # Pattern: ?  word-   or :  word-
        line = re.sub(r'(\?|:)[ ]{2}(text-|bg-|border-|font-|hover:|dark:|focus:|p-|m-|rounded-|w-|h-|flex-|grid-|absolute|relative|fixed|sticky|z-|inset-|top-|bottom-|left-|right-|overflow-|opacity-|scale-|transition|duration-|ease-|animate-|cursor-)', r'\1 \'\2', line)
        
        # Fix mid-string quote corruptions
        # Pattern: 0'text-
        line = re.sub(r'([a-z0-9/\[\]#_-])\'(text-|bg-|border-|font-|hover:|dark:|focus:|p-|m-|rounded-|w-|h-|flex-|grid-|absolute|relative|fixed|sticky|z-|inset-|top-|bottom-|left-|right-|overflow-|opacity-|scale-|transition|duration-|ease-|animate-|cursor-)', r'\1 \2', line)
        
        # Fix empty string corruptions
        # Pattern: || ')
        line = line.replace("|| ')", "|| '')")
        line = line.replace("|| ',", "|| '',")
        line = line.replace("|| '}", "|| ''}")
        line = line.replace(": ')", ": '')")
        line = line.replace(": '}", ": ''}")
        line = line.replace(", ')", ", '')")
        line = line.replace(", '}", ", ''}")
        line = line.replace("= ';", "= '';")
        
        # Fix classList.add( bg-
        line = line.replace("( bg-", "('bg-")
        line = line.replace(",  text-", ", 'text-")
        
        # Fix interfaces
        line = line.replace(": 'globalThis.File;", ": globalThis.File;")
        line = line.replace(": 'Record<", ": Record<")
        line = line.replace(": 'StorageFile[];", ": StorageFile[];")
        line = line.replace(": 'CountryInfo[]", ": CountryInfo[]")
        line = re.sub(r"digits: '([0-9\[\] ,]+),", r"digits: \1,", line)
        
        # Fix useState
        line = line.replace(" state(", " useState(")
        line = line.replace("(state(", "(useState(")
        line = line.replace("= state(", "= useState(")
        line = re.sub(r"^state\(", "useState(", line)
        
        fixed_lines.append(line)

    with open(path, 'w') as f:
        f.writelines(fixed_lines)

fix_file('/src/App.tsx')
