import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import * as toGeoJSON from "@tmcw/togeojson";
import './App.css';

export default function KMLViewer() {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true); // Start loading
      const reader = new FileReader();
      reader.onload = (e) => {
        const parser = new DOMParser();
        const kml = parser.parseFromString(e.target.result, "text/xml");
        const geoJson = toGeoJSON.kml(kml);
        setGeoJsonData(geoJson);
        calculateSummary(geoJson);
        setIsLoading(false); // Stop loading
      };
      reader.readAsText(file);
    }
  };

  const calculateSummary = (geoJson) => {
    const summaryData = {};
    geoJson.features.forEach((feature) => {
      const type = feature.geometry.type;
      summaryData[type] = (summaryData[type] || 0) + 1;
    });
    setSummary(summaryData);
  };

  const calculateDetails = () => {
    if (!geoJsonData) return;
    const detailsData = {};

    geoJsonData.features.forEach((feature) => {
      const type = feature.geometry.type;
      if (type === "LineString") {
        const length = feature.geometry.coordinates.reduce((sum, coords, index, arr) => {
          if (index === 0) return sum;
          const prev = arr[index - 1];
          return sum + Math.sqrt(
            Math.pow(coords[0] - prev[0], 2) + Math.pow(coords[1] - prev[1], 2)
          );
        }, 0);
        detailsData[type] = (detailsData[type] || 0) + length;
      } else if (type === "MultiLineString") {
        feature.geometry.coordinates.forEach((line) => {
          const length = line.reduce((sum, coords, index, arr) => {
            if (index === 0) return sum;
            const prev = arr[index - 1];
            return sum + Math.sqrt(
              Math.pow(coords[0] - prev[0], 2) + Math.pow(coords[1] - prev[1], 2)
            );
          }, 0);
          detailsData[type] = (detailsData[type] || 0) + length;
        });
      }
    });

    console.log("Calculated details:", detailsData); // Logging to check if details are calculated correctly
    setDetails(detailsData);
  };

  return (
    <div className="container">
      <h2>KML File Viewer</h2>
      <input
        type="file"
        accept=".kml"
        onChange={handleFileUpload}
        className="file-input"
      />

      <div className="buttons">
        <button onClick={() => setSummary(summary)}>Summary</button>
        <button onClick={calculateDetails}>Detailed</button>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          Loading map...
        </div>
      )}

      {summary && (
        <div>
          <h3>Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Element Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {details && (
        <div>
          <h3>Detailed</h3>
          <table>
            <thead>
              <tr>
                <th>Element Type</th>
                <th>Total Length (km)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(details).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{(value / 1000).toFixed(2)} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {geoJsonData && (
        <MapContainer center={[37.422, -122.082]} zoom={2} style={{ height: "400px", marginTop: "100px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={geoJsonData} />
        </MapContainer>
      )}
    </div>
  );
}