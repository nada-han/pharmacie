import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // Importer le composant MarkerClusterGroup
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet'; // Importer Icon de leaflet
import markerIcon from './marker-icon.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';
import L from 'leaflet';


function Body() {
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [isGardeSelected, setIsGardeSelected] = useState(false);
    const [selectedGarde, setSelectedGarde] = useState(null);
    const [pharmacies, setPharmacies] = useState([]);
    const [pharmacyCoords, setPharmacyCoords] = useState([]);
    const [pharmacyLocations, setPharmacyLocations] = useState([]);

    const [map, setMap] = useState(null);

    useEffect(() => {
        const fetchCities = async () => {
            const res = await fetch('https://pharmacy-liard.vercel.app/api/cities');
            const data = await res.json();
            setCities(data);
        };
        fetchCities();
    }, []);

    const gardeOptions = [{ value: 'jour', label: 'Garde de jour' }, { value: 'nuit', label: 'Garde de nuit' },];

    const handleGardeChange = (selectedOption) => {
        setSelectedGarde(selectedOption);
    };
    const handleCityChange = (selectedOption) => {
        setSelectedCity(selectedOption);
        setSelectedZone(null);
        setIsGardeSelected(false);
    };

    useEffect(() => {
        if (selectedCity) {
            const fetchZones = async () => {
                const res = await fetch(`https://pharmacy-liard.vercel.app/api/zones/city/${selectedCity.value}`);
                const data = await res.json();
                setZones(data);
            };
            fetchZones();
        } else {
            setZones([]);
        }
    }, [selectedCity]);

    const handleZoneChange = (selectedOption) => {
        setSelectedZone(selectedOption);
        setIsGardeSelected(false);
    };

    const handleGardeSelect = () => {
        setIsGardeSelected(!isGardeSelected);
    };
    const handleSearch = async () => {
        if (selectedCity && selectedZone && selectedGarde) {
            try {
                const res = await fetch(`https://pharmacy-liard.vercel.app/api/pharmacies/${selectedGarde.value}/${selectedZone.value}/${selectedCity.value}`);
                const data = await res.json();
                setPharmacies(data);
                const locations = data.map(pharmacy => ({
                    lat: pharmacy.latitude,
                    lon: pharmacy.longitude,
                    name: pharmacy.name,
                    address: pharmacy.address
                }));
                setPharmacyLocations(locations);
    
                // Calculer les limites de la zone de zoom
                const bounds = locations.reduce(
                    (acc, location) => acc.extend([location.lat, location.lon]),
                    L.latLngBounds()
                );
    
                // Utiliser la fonction fitBounds pour zoomer sur les limites de la zone
                map.fitBounds(bounds);
            } catch (err) {
                console.error(err.message);
            }
        }
    };
    

    const customIcon = new Icon({
        iconUrl: markerIcon,
        iconSize: [30, 30],
    });

    const handleMapReady = (map) => {
        setMap(map);
    };
    
    

      
    return (
        <div className="App">

            <div className="container">
                <div className="menu-container">
                    <div className="menu-item">
                        <label>Ville :</label>
                        <Select
                            className="select"
                            options={cities.map((city) => ({
                                value: city._id,
                                label: city.name,
                            }))}
                            value={selectedCity}
                            onChange={handleCityChange}
                            placeholder="Sélectionnez une ville"
                        />
                    </div>
                    <div className="menu-item">
                        <label>Zone :</label>
                        {selectedCity ? (
                            <Select
                                className="select"
                                options={zones.map((zone) => ({
                                    value: zone._id,
                                    label: zone.name,
                                }))}
                                value={selectedZone}
                                onChange={handleZoneChange}
                                placeholder="Sélectionnez une zone"
                            />
                        ) : (
                            <Select
                                className="select"
                                options={[]}
                                isDisabled={true}
                                placeholder="Sélectionnez une ville d'abord"
                            />
                        )}
                    </div>
                    <div className="menu-item">
                        <label>Type de garde :</label>
                        {selectedCity && selectedZone ? (
                            <Select
                                className="select"
                                options={gardeOptions}
                                value={selectedGarde}
                                onChange={handleGardeChange}
                                placeholder="Sélectionnez un type de garde"
                            />
                        ) : (
                            <Select
                                className="select"
                                options={[]}
                                isDisabled={true}
                                placeholder="Sélectionnez une ville et une zone d'abord"
                            />
                        )}
                    </div><br />
                </div>
                <div className="search-container">
                    <button className="btn btn-success" onClick={handleSearch}>
                        Rechercher
                    </button>
                </div>
                <br />
                <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ flex: 1 }}>
                    <Table striped>
                        <thead>
                            <tr>
                                <th>Pharmacie</th>
                                <th>Adresse</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pharmacies.map(pharmacy => (
                                <tr key={pharmacy.id}>
                                    <td>{pharmacy.name}</td>
                                    <td>{pharmacy.address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>



                <div className="map-container" style={{ flex: 1 }}>
                    <MapContainer
                        center={[31.91309983552669, -5.7457327976780705]} // Coordonnées du centre de la carte
                        zoom={6} // Niveau de zoom initial de la carte
                        style={{ height: "500px", width: "100%" }} // Style pour définir la hauteur et la largeur de la carte
                        whenReady={(map) => handleMapReady(map)}
                    >
                        {/* Ajouter le composant TileLayer pour afficher le fond de carte */}
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        />

                        {/* Utiliser la liste des pharmacies pour afficher les Markers sur la carte */}
                        {pharmacyLocations.map((pharmacy, index) => (
                            <Marker key={index} position={[pharmacy.lat, pharmacy.lon]} icon={customIcon}>
                                <Popup>
                                    <div>
                                        <h3>{pharmacy.name}</h3>
                                        <p>{pharmacy.address}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Utiliser le composant MarkerClusterGroup pour regrouper les Markers sur la carte */}
                        <MarkerClusterGroup>
                            {pharmacyLocations.map((pharmacy, index) => (
                                <Marker key={index} position={[pharmacy.lat, pharmacy.lon]} icon={customIcon}>
                                    <Popup>
                                        <div>
                                            <h3>{pharmacy.name}</h3>
                                            <p>{pharmacy.address}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>
                
                </div>

            </div>

        </div>

    );
}

export default Body;