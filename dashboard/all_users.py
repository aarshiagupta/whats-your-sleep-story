import pandas as pd
import os
from glob import glob

# Path config
data_dir = 'data'  # adjust if needed
merged_path = os.path.join(data_dir, 'MergedUserData')
activity_path = os.path.join(data_dir, 'DataPaper')

# Output
user_rows = []

# Loop through users
for i in range(1, 23):
    if i == 11:
        continue  # Skip user 11 (missing or deleted)
    try:
        merged_file = f"{merged_path}/merged_user_{i}.csv"
        activity_file = f"{activity_path}/user_{i}/Activity.csv"

        # Load merged summary row
        merged_df = pd.read_csv(merged_file)
        summary = merged_df.iloc[0].to_dict()

        # Load activity file
        activity_df = pd.read_csv(activity_file)

        # Fix 24:00 edge case
        activity_df['Start'] = activity_df['Start'].replace("24:00", "00:00")
        activity_df['End'] = activity_df['End'].replace("24:00", "00:00")

        # Parse time columns
        activity_df['Start'] = pd.to_datetime(activity_df['Start'], format='%H:%M')
        activity_df['End'] = pd.to_datetime(activity_df['End'], format='%H:%M')

        # Compute duration in minutes
        duration = (activity_df['End'] - activity_df['Start']).dt.total_seconds() / 60
        activity_df['Duration'] = duration.where(duration > 0, duration + 1440)  # handle overnight sessions

        # Sum total active minutes
        total_minutes = activity_df['Duration'].sum()
        summary['activityMinutes'] = round(total_minutes, 1)

        # Append to output
        user_rows.append(summary)

    except Exception as e:
        print(f"Error with user {i}: {e}")

# Final output
final_df = pd.DataFrame(user_rows)
final_df.to_csv('data/all_users.csv', index=False)
print("✅ all_users.csv created with activityMinutes included.")
