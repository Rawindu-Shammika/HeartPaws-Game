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
