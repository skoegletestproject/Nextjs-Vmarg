import connectDB from "@/Database/db";
import GeoFencing from "@/Database/Models/GeoFencing";


export default async function handler(req, res) {
    await connectDB();

    const { method } = req;
    const { deviceName } = req.query; 
    switch (method) {
        case "POST": {
            const { customerId, latitude, longitude } = req.body;
            const findDevice = await GeoFencing.findOne({ deviceName });

            if (findDevice) {
                return res.status(400).json({ message: `GeoFencing already exists for Device ${findDevice.deviceName}` });
            }

            const geoFencing = new GeoFencing({ customerId, deviceName, latitude, longitude });
            try {
                await geoFencing.save();
                return res.status(201).json(geoFencing);
            } catch (error) {
                return res.status(400).json({ message: "Error saving geofencing", error });
            }
        }

        case "GET": {
            try {
                const geoFencing = await GeoFencing.findOne({ deviceName });
                if (!geoFencing) return res.status(404).json({ message: "Geofencing not found" });
                return res.status(200).json(geoFencing);
            } catch (error) {
                return res.status(500).json({ message: "Error fetching geofencing", error });
            }
        }

        case "PUT": {
            const { latitude, longitude,radius } = req.body;
            try {
                const geoFencing = await GeoFencing.findOneAndUpdate(
                    { deviceName },
                    { latitude, longitude ,radius},
                    { new: true, runValidators: true }
                );

                if (!geoFencing) return res.status(404).json({ message: "Geofencing entry not found" });

                return res.status(200).json({ message: "Geofencing updated successfully", geoFencing });
            } catch (error) {
                return res.status(400).json({ message: "Error updating geofencing", error });
            }
        }

        case "DELETE": {
            try {
                const geoFencing = await GeoFencing.findOneAndDelete({ deviceName });
                if (!geoFencing) return res.status(404).json({ message: "Geofencing not found" });

                return res.status(200).json(geoFencing);
            } catch (error) {
                return res.status(500).json({ message: "Error deleting geofencing", error });
            }
        }

        default:
            res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
            return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
}
