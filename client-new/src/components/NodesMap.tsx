import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { CheckCircle, Warning, Build } from '@mui/icons-material';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface CdnNode {
  id: number;
  name: string;
  hostname: string;
  ip_address: string;
  location: string;
  region: string;
  country: string;
  status: 'online' | 'offline' | 'maintenance';
  node_type: 'edge' | 'origin' | 'cache';
  capacity_gb: number;
  bandwidth_mbps: number;
  created_at: string;
  created_by_name: string;
  latitude?: number;
  longitude?: number;
}

interface NodesMapProps {
  nodes: CdnNode[];
  onNodeClick?: (node: CdnNode) => void;
}

// Vietnam coordinates for default center
const VIETNAM_CENTER = { lat: 16.0475, lng: 108.2062 };

// Location coordinates mapping
const LOCATION_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Hanoi': { lat: 21.0285, lng: 105.8542 },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
  'Da Nang': { lat: 16.0544, lng: 108.2022 },
  'Can Tho': { lat: 10.0452, lng: 105.7469 },
  'Hai Phong': { lat: 20.8449, lng: 106.6881 },
  'Test Location': { lat: 10.8231, lng: 106.6297 },
  'Ho Chi Minh City, Asia': { lat: 10.8231, lng: 106.6297 },
  'Test Location, Asia': { lat: 10.8231, lng: 106.6297 },
  'Hanoi, Asia': { lat: 21.0285, lng: 105.8542 },
  'Da Nang, Asia': { lat: 16.0544, lng: 108.2022 },
  'Can Tho, Asia': { lat: 10.0452, lng: 105.7469 },
  'Hai Phong, Asia': { lat: 20.8449, lng: 106.6881 },
};

const getNodeCoordinates = (node: CdnNode) => {
  // If node has explicit coordinates, use them
  if (node.latitude && node.longitude) {
    return { lat: node.latitude, lng: node.longitude };
  }
  
  // Try to find coordinates by location
  const locationKey = node.location || `${node.location}, ${node.region}`;
  if (LOCATION_COORDINATES[locationKey]) {
    return LOCATION_COORDINATES[locationKey];
  }
  
  // Fallback to region-based coordinates
  if (node.region === 'Asia') {
    return LOCATION_COORDINATES['Ho Chi Minh City, Asia'];
  }
  
  // Default to Vietnam center
  return VIETNAM_CENTER;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return '#4caf50';
    case 'offline':
      return '#f44336';
    case 'maintenance':
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
};

const getNodeTypeColor = (type: string) => {
  switch (type) {
    case 'edge':
      return '#2196f3';
    case 'origin':
      return '#ff5722';
    case 'cache':
      return '#9c27b0';
    default:
      return '#607d8b';
  }
};

const NodesMap: React.FC<NodesMapProps> = ({ nodes, onNodeClick }) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && nodes.length > 0) {
      // Fit map to show all nodes
      const bounds = L.latLngBounds(
        nodes.map(node => getNodeCoordinates(node))
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [nodes]);

  const handleNodeClick = (node: CdnNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <Box sx={{ height: 500, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={VIETNAM_CENTER}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {nodes.map((node) => {
          const coordinates = getNodeCoordinates(node);
          const statusColor = getStatusColor(node.status);
          const typeColor = getNodeTypeColor(node.node_type);
          
          return (
            <Marker
              key={node.id}
              position={coordinates}
              eventHandlers={{
                click: () => handleNodeClick(node),
              }}
            >
              <Circle
                center={coordinates}
                radius={50000} // 50km radius
                pathOptions={{
                  color: statusColor,
                  fillColor: statusColor,
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              />
              
              <Popup>
                <Paper sx={{ p: 2, minWidth: 250 }}>
                  <Typography variant="h6" gutterBottom>
                    {node.name}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={node.status}
                      color={node.status === 'online' ? 'success' : node.status === 'offline' ? 'error' : 'warning'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={node.node_type}
                      variant="outlined"
                      size="small"
                      sx={{ color: typeColor, borderColor: typeColor }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Hostname:</strong> {node.hostname}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>IP:</strong> {node.ip_address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Location:</strong> {node.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Capacity:</strong> {node.capacity_gb} GB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Bandwidth:</strong> {node.bandwidth_mbps} Mbps
                  </Typography>
                </Paper>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default NodesMap; 