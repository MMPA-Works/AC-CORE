import axios from "axios";
import cron from "node-cron";
import NodeCache from "node-cache";

const weatherCache = new NodeCache();
const IS_RAINING_KEY = "is_raining_angeles_city";

const checkWeather = async () => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const city = "Angeles City,PH";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    const response = await axios.get(url);
    
    // OpenWeatherMap uses codes 200 to 599 for rain, drizzle, and thunderstorms
    const weatherId = response.data.weather[0].id;
    const isRaining = weatherId >= 200 && weatherId < 600;

    weatherCache.set(IS_RAINING_KEY, isRaining);
  } catch (error) {
    console.error("Weather fetch failed", error);
  }
};

cron.schedule("*/10 * * * *", checkWeather);

export const getIsRaining = (): boolean => {
  return weatherCache.get(IS_RAINING_KEY) ?? false;
};

checkWeather();