async function convertSupabaseUrl(file) {
    if (file.data.startsWith('http://') || file.data.startsWith('https://')) {
        try {
            const response = await fetch(file.data);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const base64String = Buffer.from(arrayBuffer).toString('base64');
            inlineData.data = base64String;
        } catch (error) {
            console.error('Error downloading file: ', error);
            // Fallback to the original file.data
            inlineData.data = file.data;
        }
    } else {
        // If it's not a URL, we treat it as-is
        inlineData.data = file.data;
    }
}