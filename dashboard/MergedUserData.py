import os
import pandas as pd

# Input/output paths
base_path = "DataPaper"
user_dirs = sorted([d for d in os.listdir(base_path) if d.startswith("user_")])
output_folder = "MergedUserData"
os.makedirs(output_folder, exist_ok=True)

for user in user_dirs:
    user_path = os.path.join(base_path, user)
    row = {"participant": user}

    try:
        # --- user_info.csv ---
        info_df = pd.read_csv(os.path.join(user_path, "user_info.csv"))
        row["Gender"] = info_df["Gender"].iloc[0]
        row["Height"] = info_df["Height"].iloc[0]
        row["Weight"] = info_df["Weight"].iloc[0]
        row["Age"] = info_df["Age"].iloc[0]

        # --- sleep.csv ---
        sleep_df = pd.read_csv(os.path.join(user_path, "sleep.csv"))
        for col in sleep_df.columns:
            row[col] = sleep_df[col].iloc[0]

        # --- questionnaire.csv ---
        q_df = pd.read_csv(os.path.join(user_path, "questionnaire.csv"))
        row["MEQ"] = q_df["MEQ"].iloc[0]
        row["Daily_stress"] = q_df["Daily_stress"].iloc[0]
        row["Pittsburgh"] = q_df["Pittsburgh"].iloc[0]

        # Final column order
        col_order = ["participant", "Gender", "Height", "Weight", "Age"]
        other_cols = [col for col in row if col not in col_order]
        final_cols = col_order + other_cols

        # Build DataFrame and remove any "Unnamed" columns
        df = pd.DataFrame([row])[final_cols]
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        # Save to MergedUserData/merged_user_X.csv
        user_num = user.split("_")[1]
        output_path = os.path.join(output_folder, f"merged_user_{user_num}.csv")
        df.to_csv(output_path, index=False)
        print(f"✅ Saved: {output_path}")

    except Exception as e:
        print(f"⚠️ Skipped {user} due to error: {e}")
