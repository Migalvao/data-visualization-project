import pandas as pd
import time

start = time.time()

# Aggregates status data hour by hour
file = "C:/Users/Miguel Galvão/Desktop/data/status.csv"
relevant_ids = [39, 41, 42, 45, 46, 47, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 82]

new_df = pd.DataFrame(columns=['station_id', 'bikes_available', 'docks_available', 'time'])

print("Starting!")
print("Reading data...")

df = pd.read_csv(file)

end = time.time()
print(f"Done! {end - start} s\nProcessing data...")

for i, id in enumerate(relevant_ids):
    station_status = df[df['station_id'] == id] # gather data for specific station
    times = pd.to_datetime(station_status['time'])  # convert time column to datetime object
    # group values by day and hour
    station_status_by_hour = station_status.groupby([times.dt.dayofyear, times.dt.hour]).mean()

    print(station_status_by_hour)

    #df3 = df1.append(df2, ignore_index=True)
    

    print(f"{i + 1} in {len(relevant_ids)} done...")
    break

end = time.time()
print(f"All data processed! {end - start} s\nWriting to new file...")

new_df.to_csv(index=False)
end = time.time()
print(f"All done! {end - start} s")