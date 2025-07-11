import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDCL7E3J7PXYlOVkAZuee9AWKdcmcqpdLs",
  authDomain: "esp32-iot-project-75fdf.firebaseapp.com",
  databaseURL: "https://esp32-iot-project-75fdf-default-rtdb.firebaseio.com",
  projectId: "esp32-iot-project-75fdf",
  storageBucket: "esp32-iot-project-75fdf.firebasestorage.app",
  messagingSenderId: "977259537662",
  appId: "1:977259537662:web:767238c95db10f90a7f1af"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function RealtimeDashboard() {
  const [deviceIds, setDeviceIds] = useState([]);
  const [deviceData, setDeviceData] = useState({});
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    const iotRef = ref(db, 'iot');
    onValue(iotRef, (snapshot) => {
      const devices = snapshot.val();
      if (!devices) return;

      const ids = Object.keys(devices);
      setDeviceIds(ids);
      setSelectedDevice((current) => current || ids[0] || '');

      const updatedData = {};
      ids.forEach((id) => {
        const logs = devices[id]?.logs || {};
        const chartData = Object.values(logs).map((entry) => {
          const { timestamp, ...rest } = entry;
          return {
            timestamp,
            time: new Date(timestamp).toLocaleTimeString(),
            ...rest
          };
        });
        chartData.sort((a, b) => a.timestamp - b.timestamp);
        updatedData[id] = chartData.slice(-30);
      });
      setDeviceData(updatedData);

      // Debug log for all received device data
      // console.log("All deviceData:", updatedData);
    });
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const chartLabels = (deviceData[selectedDevice] || []).map(d => d.time);
  const chartValues = (deviceData[selectedDevice] || []).map(d => d.temperature || 0);

  // Make chart width responsive to the number of points (60px per point or min screen width)
  const chartWidth = Math.max(chartLabels.length * 100, screenWidth - 32);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌡️ ESP32 Live Sensor Dashboard</Text>
      {/* Debug: show current data as JSON */}
      {/* <Text selectable style={{ fontSize: 10, color: 'red', marginBottom: 6 }}>
        {JSON.stringify(deviceData[selectedDevice] || [], null, 2)}
      </Text> */}

      {deviceIds.length > 0 && (
        <Picker
          selectedValue={selectedDevice}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDevice(itemValue)}
        >
          {deviceIds.map(id => (
            <Picker.Item key={id} label={id} value={id} />
          ))}
        </Picker>
      )}
      {selectedDevice && deviceData[selectedDevice] && (
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>{selectedDevice} - Live Chart</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{ data: chartValues }]
              }}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: "#f1f1f1",
                backgroundGradientTo: "#e1e1e1",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    backgroundColor: "#f6f7fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginVertical: 16,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
    color: "#444",
  },
  picker: {
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    elevation: 1, // Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 28,
    marginVertical: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  chart: {
    borderRadius: 10,
    marginTop: 4,
  },
});
