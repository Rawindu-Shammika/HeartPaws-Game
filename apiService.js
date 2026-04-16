// apiService.js
// Theme 1 - fetching data from external APIs so everything is kept in one place.

export async function fetchRescueChallenge() {
    try {
        const response = await fetch("https://marcconrad.com/uob/heart/api.php");
        const data = await response.json();
        return data; // returns the math problem and answer
    } catch (error) {
        console.error("Error fetching rescue challenge:", error);
        throw error;
    }
}

// Theme 3 Interoperability: Consuming CATAAS binary image stream alongside Heart API JSON data.
export async function fetchCataasImage() {
    try {
        const response = await fetch("https://cataas.com/cat");
        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);
        return imgUrl;
    } catch (error) {
        console.error("Error fetching cat image:", error);
        throw error;
    }
}
