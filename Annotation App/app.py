import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from gspread_formatting import *
import json
import subprocess
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account

def create_df(annotations):
  for i in range(4):
    if i == 0:
        with open("project/public/masks_Adi.json", "r") as f:
            masks = json.load(f)

    if i == 2:
        with open("project/public/masks_Arik.json", "r") as f:
            masks = json.load(f)

    if i == 1:
        with open("project/public/masks_Yoni.json", "r") as f:
            masks = json.load(f)
    if i == 3:
        with open("project/public/masks_Gezer.json", "r") as f:
            masks = json.load(f)

    worksheet = sh.get_worksheet(i)
    values = worksheet.get_all_values()
    df = pd.DataFrame(values[1:], columns=values[0])
    df.index = df["image\split"]
    df = df.drop(columns=["image\split"]).rename_axis(None, axis=0)
    for image in df.index:
      if image not in annotations:
            annotations[image] = {}
      lll = []
      for s in range(16):
        if f'split_{s}' not in annotations[image]:
            annotations[image][f'split_{s}'] = {}
        annotated_masks = [m for m in list(annotations[image][f'split_{s}'].keys()) if m.startswith("mask_") and annotations[image][f'split_{s}'][m]!=""]
        not_annoted_masks = [m for m in list(masks[image][f'split_{s}'].keys()) if m.startswith("mask_") and m not in annotated_masks]
        masks_list = not_annoted_masks+annotated_masks
        n = len(masks_list)
        annted = len(annotated_masks)
        if annted!=n:
            lll.append(f"{annted}/{n} ({n-annted})")
        else:
            lll.append(f"{annted}/{n}")
      df.loc[image] = lll


    header = df.columns.values.tolist()
    values = df.values.tolist()

    header.insert(0, 'image\split')
    for i, row in enumerate(values):
        row.insert(0, df.index[i])

    data = [header] + values

    range_to_update = worksheet.range(f"A1:Q{len(df.index)+1}")  # Get the range to update
    for i, cell in enumerate(range_to_update):
        cell.value = data[i // len(data[0])][i % len(data[0])]

    worksheet.update_cells(range_to_update)  # Update the cells with new values

    set_column_width(worksheet, 'A', 180)
    set_column_width(worksheet, 'B:Q', 80)

    worksheet.format(f"A1", {
        "horizontalAlignment": "CENTER",
        "textFormat": {
            "bold": False
        }
    })
    worksheet.format("A:Z", {
        "textFormat": {
            "fontSize": 9,
            "bold": False
        }
    })
    # Create a conditional format rule for cells containing "(" and starting with "0/"
    rule1 = ConditionalFormatRule(
        ranges=[GridRange.from_a1_range(f'B2:Q{len(df.index)+1}', worksheet)],
        booleanRule=BooleanRule(
            condition=BooleanCondition('CUSTOM_FORMULA', [f'=AND(ISNUMBER(SEARCH("(", INDIRECT("RC", FALSE))), REGEXMATCH(INDIRECT("RC", FALSE), "^0\/.*"))']),
            format=CellFormat(backgroundColor=Color(1, 0.3, 0.2))  # red color
        )
    )
    # Create a conditional format rule for cells not containing "("
    rule2 = ConditionalFormatRule(
        ranges=[GridRange.from_a1_range(f'B2:Q{len(df.index)+1}', worksheet)],
        booleanRule=BooleanRule(
            condition=BooleanCondition('TEXT_NOT_CONTAINS', ['(']),
            format=CellFormat(backgroundColor=Color(0, 1, 0)) # green color
        )
    )
    # Create a conditional format rule for cells containing "(" and mot starting with "0/"
    rule3 = ConditionalFormatRule(
    ranges=[GridRange.from_a1_range(f'B2:Q{len(df.index)+1}', worksheet)],
    booleanRule=BooleanRule(
        condition=BooleanCondition('CUSTOM_FORMULA', [f'=AND(ISNUMBER(SEARCH("(", INDIRECT("RC", FALSE))), NOT(REGEXMATCH(INDIRECT("RC", FALSE), "^0\/.*")))']),
        format=CellFormat(backgroundColor=Color(1, 1, 0))  # yellow color
        )
    )

    rules = get_conditional_format_rules(worksheet)
    rules.clear()
    rules.append(rule1)
    rules.append(rule2)
    rules.append(rule3)
    rules.save()

if __name__ == '__main__':

    print("\033[0;91m\n---------------------------\nDON'T CLOSE THIS TERMINAL!\n---------------------------\n\033[0m")

    try:
        result = subprocess.run(['Annotation.bat'], shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError:
        exit(1)

    service_account_key_file = "server/service_account.json"
    local_json_path = "server/annotations.json"
    local_drive_json_path = "server/annotations_drive.json"

    credentials = ServiceAccountCredentials.from_json_keyfile_name(service_account_key_file, scopes=['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'])
    gc = gspread.authorize(credentials)
    sh = gc.open('status')

    credentials = service_account.Credentials.from_service_account_file(
        service_account_key_file, scopes=["https://www.googleapis.com/auth/drive"]
    )
    service = build("drive", "v3", credentials=credentials)

    results = service.files().list(q=f"name = 'annotations.json'").execute()
    fileId = results["files"][0]["id"]
    request = service.files().get_media(fileId=fileId)
    driva_anns = request.execute()
    with open(local_drive_json_path, "wb") as f:
        f.write(driva_anns)

    with open(local_drive_json_path, "r") as f:
        annotations_drive = json.load(f)

    with open(local_json_path, "r") as f:
        annotations = json.load(f)

    for img in annotations_drive:
        if img not in annotations:
            annotations[img] = {}
        for sp in annotations_drive[img]:
            if sp not in annotations[img]:
                annotations[img][sp] = {}
            for m in annotations_drive[img][sp]:
                if m not in annotations[img][sp]:
                    annotations[img][sp][m] = annotations_drive[img][sp][m]

    with open(local_json_path, "w") as f:
        json.dump(annotations, f)

    with open(local_json_path, "rb") as f:
        media = MediaIoBaseUpload(f, mimetype="application/json")
        update_request = service.files().update(fileId=fileId, media_body=media).execute()

    create_df(annotations)

    print("\nDone.")



