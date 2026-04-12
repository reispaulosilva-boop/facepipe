
import json

def get_mirror(idx):
    # This is a simplified mirror map based on observation of top-level lists
    # A full map would be better, but we can check if the mapping is consistent
    pass

with open('/Users/paulosilvareis/Documents/facepipe/src/data/topographicIndices.json', 'r') as f:
    data = json.load(f)

# Common mirror pairs we found
pairs = {
    111: 340, 143: 372, 156: 383, 226: 446, 110: 339, 24: 254, 23: 253, 22: 252, 26: 256, 112: 341, 
    243: 463, 193: 417, 122: 351, 188: 412, 121: 350, 120: 349, 119: 348, 118: 347, 117: 346,
    162: 389, 139: 368, 21: 251, 54: 284, 103: 332, 104: 333, 105: 334, 63: 293, 70: 300,
    50: 280, 187: 411, 206: 426, 98: 327, 64: 294, 49: 279, 217: 437,
    147: 376, 93: 323, 234: 454, 127: 356,
    165: 391, 92: 322, 186: 410, 57: 287, 202: 422, 192: 416, 215: 435, 132: 361,
    194: 418, 204: 424, 201: 421, 200: 420, 421: 201, 418: 194, 288: 58, 172: 397, 136: 365, 150: 379, 149: 378, 176: 400, 140: 369, 32: 262,
    377: 148, 152: 152, # midline
    2: 2, 97: 326, 327: 98, 391: 165, 393: 164, 164: 393, 167: 395, # wait, check these
    61: 291, 185: 409, 40: 270, 39: 269, 37: 267, 0: 0,
}

regions = data.keys()
for r in regions:
    if r.endswith('_r'):
        left_name = r.replace('_r', '_l')
        if left_name in data:
            right_indices = data[r]
            left_indices = data[left_name]
            print(f"Checking {r} vs {left_name}")
            if len(right_indices) != len(left_indices):
                print(f"  Length mismatch: {len(right_indices)} vs {len(left_indices)}")
            else:
                for i in range(len(right_indices)):
                    ri = right_indices[i]
                    li = left_indices[i]
                    # Check if ri mirrors to li
                    # For now just print them
                    print(f"  {ri} <-> {li}")
