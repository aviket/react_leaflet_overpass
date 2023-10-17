// https://codesandbox.io/s/spring-flower-x2dr5n
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  Marker,
  FeatureGroup
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { Icon} from "leaflet";
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-shadow.png";
import axios from 'axios';
import 'leaflet/dist/leaflet.css';



import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';


let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

const baseMaps = {
  OpenStreetMap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  Satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  // Add more base maps here...
};



const PolygonMap = () => {
  const [activePolygon, setActivePolygon] = useState(null);
  const [selectedBaseMap, setSelectedBaseMap] = useState("OpenStreetMap");
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [posMarkers, setPosMarkers] = useState([]);
  const latlons = [];

  const handleBaseMapChange = (event) => {
    setSelectedBaseMap(event.target.value);
  };

  const addMarkers = (latlons) => {
    console.log(latlons)
    setPosMarkers(latlons);
  }

  
 




  function makeOverpassQuery(qstrg) {
    // Split the input string into individual coordinates
    const coordinates = qstrg.split(" ");
    coordinates.pop();

    console.log(coordinates);

    // Ensure that we have a valid number of coordinates
    if (coordinates.length % 2 !== 0) {
      throw new Error("Invalid number of coordinates in qstrg");
    }

    // Construct the query dynamically based on the coordinates
    const coordinatePairs = [];
    let ply1 = '';
    for (let i = 0; i < coordinates.length; i += 2) {
      const lat = coordinates[i];
      console.log(lat);
      const lon = coordinates[i + 1];
      ply1 += lat;
      ply1 += " ";
      ply1 += lon;
      ply1 += " ";

    }

    // Join the coordinate pairs to create the polygon in the query
    // const polygon = coordinatePairs.join(" ");
    ply1 = ply1.trim();

    console.log(ply1);

    const overpassQuery = `
      [out:json];
      node["amenity"="restaurant"](poly:"` + ply1 + `");
      out;
    `;

    return overpassQuery;
  }


  const handleDrawCreated = (e) => {
    console.log(e);
    const { layer } = e;
    setDrawnPolygon(layer.toGeoJSON());
    const points = layer.toGeoJSON().geometry.coordinates[0];
    let qstrg = '';
    points.forEach(point => {
      const x = point[0];
      const y = point[1];
      qstrg += y;
      qstrg += " " + x + " ";





    });
    console.log(qstrg);
    const qry = makeOverpassQuery(qstrg);
    console.log(qry);
    const encodedQuery = encodeURIComponent(qry);
    const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

    axios.get(overpassApiUrl)
      .then(response => {
        // Handle the response data here
        // console.log(response.data);
        const restaurants = response.data.elements.filter(node => node.tags && node.tags.name);
        // console.log(restaurants);
        response.data.elements.forEach(restaurant => {
          console.log(restaurant.lat);
          console.log(restaurant.lon);
          const rname = restaurant.tags.name ? restaurant.tags.name : undefined;

          latlons.push([[restaurant.lat, restaurant.lon], rname]);
          
          //   console.log(restaurant.tags.name);
          //   console.log(restaurant.tags.phone);
          //   console.log(restaurant.tags.cuisine);



          //   console.log("______");
        });
        addMarkers(latlons);
        console.log(latlons);
      })
      .catch(error => {
        console.log("error", error);
      });

  };




  return (
    <MapContainer
      center={[22.308155, 70.800705]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={baseMaps[selectedBaseMap]}
      />
      {<div>
        {posMarkers.map((data, index) => (
  <Marker position={data[0]} key={index}>
    {data[1] ? (
      <Popup>
        <span>{data[1]}</span>
      </Popup>
    ) : null}
  </Marker>
))}

      
      </div>}
      {/* {polygonData.map((polygon) => (
        <Polygon
          key={polygon.id}
          positions={polygon.coordinates}
          color={polygon.workers === 0 ? "red" : "blue"}
          eventHandlers={{
            click: () => {
              setActivePolygon(polygon);
            }
          }}
        />
      ))} */}
      {/* {activePolygon && (
        <Popup
          position={[
            activePolygon.coordinates[0][0],
            activePolygon.coordinates[0][1],
            activePolygon.coordinates[0][2]
          ]}
          onClose={() => {
            setActivePolygon(null);
          }}
        >
          <div>
            <h2>Zone {activePolygon.id}</h2>
            <p>Workers: {activePolygon.workers}</p>
          </div>
        </Popup>
      )} */}

      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={handleDrawCreated}
          draw={{
            rectangle: true,
            polyline: false,
            circle: false,
            circlemarker: false,
            marker: false
          }}
        />
      </FeatureGroup>

      {/* Base Map Selector */}
      <div
        style={{
          marginTop: "150px",
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: 10,
          borderRadius: 5
        }}
      >
        <label htmlFor="baseMapSelect">Base Map:</label>
        <select
          id="baseMapSelect"
          value={selectedBaseMap}
          onChange={handleBaseMapChange}
        >
          {Object.keys(baseMaps).map((mapName) => (
            <option key={mapName} value={mapName}>
              {mapName}
            </option>
          ))}
        </select>
        {/* {drawnPolygon && (
          <p>Workers inside drawn polygon: {"tmp"}</p>
        )} */}
      </div>
    </MapContainer>
  );
};

export default PolygonMap;
