import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export default async (req, res) => {
    const token = process.env.ENV_NOTION_TOKEN;
    const databaseId = process.env.ENV_DATABASE_ID;
    const checkboxName = process.env.ENV_CHECKBOX_PROPERTY_NAME;  // Name of the checkbox property

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2021-05-13',
                'Content-Type': 'application/json'
            },
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Notion API error: ${response.status} ${JSON.stringify(data)}`);
        }

        const processedData = processData(data.results, checkboxName);
        res.json(processedData);
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: error.message });
    }
};

const processData = (data, checkboxName) => {
    const checkboxMap = new Map();

    data.forEach(item => {
        const dateProperty = item.properties.Date;
        const checkboxProperty = item.properties[checkboxName];

        // Ensure both Date and checkbox properties exist and the checkbox is checked
        if (dateProperty && checkboxProperty && checkboxProperty.checkbox) {
            const dateObject = new Date(dateProperty.created_time);

            // Check if the date is valid
            if (!isNaN(dateObject.getTime())) {
                dateObject.setDate(dateObject.getDate() + 1); // Add one day to the date
                const date = dateObject.toISOString().split('T')[0]; // Format back to YYYY-MM-DD
                checkboxMap.set(date, true);
            } else {
                console.error('Invalid date:', dateProperty.created_time);
            }
        }
    });

    return Array.from(checkboxMap).map(([date, isChecked]) => ({ date, isChecked }));
};
