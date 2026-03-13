import axios from "axios";
import cron from "node-cron";
import NodeCache from "node-cache";

const weatherCache = new NodeCache();
const WEATHER_KEY = "angeles_city_weather";

const checkWeather = async () => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const city = "Angeles City,PH";
    // Added &units=metric to get Celsius instead of Kelvin
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;
    
    const weatherId = data.weather[0].id;
    const isRaining = weatherId >= 200 && weatherId < 600;

    const weatherData = {
      isRaining,
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity
    };

    weatherCache.set(WEATHER_KEY, weatherData);
  } catch (error) {
    console.error("Weather fetch failed", error);
  }
};

cron.schedule("*/10 * * * *", checkWeather);

export const getIsRaining = (): boolean => {
  const data = weatherCache.get<any>(WEATHER_KEY);
  return data ? data.isRaining : false;
};

// New function to expose the full weather object
export const getCurrentWeather = () => {
  return weatherCache.get(WEATHER_KEY) || null;
};

checkWeather();