const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degree) => (parseFloat(degree) * Math.PI) / 180;

    const R = 10000; 
    const dLat = toRadians(lat2) - toRadians(lat1);
    const dLon = toRadians(lon2) - toRadians(lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; 
};

export default haversineDistance;
