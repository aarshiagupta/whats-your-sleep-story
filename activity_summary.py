import pandas as pd
import os
from datetime import datetime

# Set the base directory where your user folders are located
base_dir = "Data/DataPaper"  # relative path from your script
output_file = "activity_summary.csv"

# Define which Activity IDs map to which behaviors
activity_map = {
    'screen_small': [8],
    'screen_large': [9],
    'movement_light': [4],
    'movement_medium': [5],
    'movement_heavy': [6],
    'caffeine': [10],
    'alcohol': [12]
}

# Helper function to compute duration in minutes
def compute_duration(start_str, end_str):
    try:
        fmt = "%H:%M"
        start = datetime.strptime(start_str, fmt)
        end = datetime.strptime(end_str, fmt)
        return max((end - start).total_seconds() / 60, 0)
    except:
        return 0

# Store results for each user
all_user_summaries = []

# Loop through each user_x folder
for folder in os.listdir(base_dir):
    if folder.startswith("user_"):
        user_path = os.path.join(base_dir, folder, "Activity.csv")
        if not os.path.isfile(user_path):
            continue

        df = pd.read_csv(user_path)
        df['duration_min'] = df.apply(lambda row: compute_duration(row['Start'], row['End']), axis=1)

        summary = {'user_id': folder}

        # Compute values for each behavior type
        for behavior, codes in activity_map.items():
            subset = df[df['Activity'].isin(codes)]
            if behavior in ['caffeine', 'alcohol']:
                summary[f"{behavior}_events"] = len(subset)
            else:
                summary[f"{behavior}_minutes"] = subset['duration_min'].sum()

        all_user_summaries.append(summary)

# Save all results to CSV
summary_df = pd.DataFrame(all_user_summaries)
summary_df = summary_df.sort_values(by="user_id", key=lambda x: x.str.extract(r'(\d+)')[0].astype(int))
summary_df.to_csv(output_file, index=False)

print(f"✅ Summary saved to {output_file}")
