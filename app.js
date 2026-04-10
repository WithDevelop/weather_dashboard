const LAT = 37.5665;
const LON = 126.9780;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`;

const WEATHER_CODES = {
    0: { label: 'Clear', icon: 'ph-sun', color: 'text-yellow-400' },
    1: { label: 'Mostly Clear', icon: 'ph-sun', color: 'text-yellow-400' },
    2: { label: 'Partly Cloudy', icon: 'ph-cloud-sun', color: 'text-slate-400' },
    3: { label: 'Overcast', icon: 'ph-cloud', color: 'text-slate-400' },
    45: { label: 'Fog', icon: 'ph-cloud-fog', color: 'text-slate-400' },
    48: { label: 'Depositing Rime Fog', icon: 'ph-cloud-fog', color: 'text-slate-400' },
    51: { label: 'Light Drizzle', icon: 'ph-cloud-rain', color: 'text-blue-400' },
    53: { label: 'Moderate Drizzle', icon: 'ph-cloud-rain', color: 'text-blue-400' },
    55: { label: 'Dense Drizzle', icon: 'ph-cloud-rain', color: 'text-blue-400' },
    61: { label: 'Slight Rain', icon: 'ph-cloud-rain', color: 'text-blue-500' },
    63: { label: 'Moderate Rain', icon: 'ph-cloud-rain', color: 'text-blue-500' },
    65: { label: 'Heavy Rain', icon: 'ph-cloud-rain', color: 'text-blue-600' },
    71: { label: 'Slight Snow', icon: 'ph-snowflake', color: 'text-blue-200' },
    73: { label: 'Moderate Snow', icon: 'ph-snowflake', color: 'text-blue-200' },
    75: { label: 'Heavy Snow', icon: 'ph-snowflake', color: 'text-blue-200' },
    95: { label: 'Thunderstorm', icon: 'ph-cloud-lightning', color: 'text-purple-500' },
};

function getWeatherInfo(code, isDay = 1) {
    const info = WEATHER_CODES[code] || { label: 'Unknown', icon: 'ph-cloud', color: 'text-slate-400' };
    let icon = info.icon;
    if (isDay === 0 && icon === 'ph-sun') {
        icon = 'ph-moon';
        info.color = 'text-indigo-300';
    } else if (isDay === 0 && icon === 'ph-cloud-sun') {
        icon = 'ph-cloud-moon';
    }
    return { ...info, icon };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDayName(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

async function fetchWeather() {
    const errorState = document.getElementById('error-state');
    const weatherContent = document.getElementById('weather-content');
    const forecastContent = document.getElementById('forecast-content');
    
    // Reset UI state to loading
    errorState.classList.add('hidden');
    weatherContent.classList.remove('hidden');
    forecastContent.classList.remove('hidden');
    document.getElementById('current-condition').innerText = 'Loading...';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.current || !data.daily) {
            throw new Error('Invalid data format received from API.');
        }

        // Update Current Weather
        const current = data.current;
        document.getElementById('current-temp').innerText = `${Math.round(current.temperature_2m)}°`;
        
        const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);
        document.getElementById('current-condition').innerText = weatherInfo.label;
        
        const iconHtml = `<i class="ph-fill ${weatherInfo.icon}"></i>`;
        const iconContainer = document.getElementById('current-icon');
        iconContainer.innerHTML = iconHtml;
        iconContainer.className = `${weatherInfo.color} text-[6rem] sm:text-[8rem] drop-shadow-lg pb-4 sm:pb-6 transition-transform duration-700 hover:rotate-12 hover:scale-105`;
        
        let todayStr = 'Unknown Date';
        if (data.daily && data.daily.time && data.daily.time[0]) {
            todayStr = formatDate(data.daily.time[0]);
            todayStr = todayStr.split(',')[1]?.trim() || todayStr;
        }
        document.getElementById('current-date').innerText = `South Korea • Today, ${todayStr}`;
        
        // Update Indicators
        const feelsLike = current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : '--';
        document.getElementById('feels-like').innerText = `${feelsLike}°`;
        
        const humidity = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : '--';
        document.getElementById('humidity').innerText = `${humidity}%`;
        
        const windSpeed = current.wind_speed_10m !== undefined ? current.wind_speed_10m : '--';
        document.getElementById('wind-speed').innerText = `${windSpeed} m/s`;
        
        const todayPrecipProb = data.daily.precipitation_probability_max && data.daily.precipitation_probability_max[0] !== undefined 
            ? data.daily.precipitation_probability_max[0] 
            : '--';
        document.getElementById('precipitation').innerText = `${todayPrecipProb}%`;
        
        // Update 7-Day Forecast
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = '';
        
        const dailyLengths = data.daily.time ? data.daily.time.length : 0;
        const daysToShow = Math.min(7, dailyLengths);
        
        for (let i = 0; i < daysToShow; i++) {
            const dateStr = data.daily.time[i];
            const maxTemp = data.daily.temperature_2m_max[i] !== undefined ? Math.round(data.daily.temperature_2m_max[i]) : '--';
            const minTemp = data.daily.temperature_2m_min[i] !== undefined ? Math.round(data.daily.temperature_2m_min[i]) : '--';
            const code = data.daily.weather_code[i];
            const info = getWeatherInfo(code);
            
            const dayName = i === 0 ? 'Today' : formatDayName(dateStr);
            const isLast = i === 6;
            
            const html = `
                <div class="flex items-center justify-between ${!isLast ? 'border-b border-slate-200/60 pb-3' : ''}">
                    <span class="${i === 0 ? 'text-slate-500 font-semibold' : 'text-slate-500 font-medium'} w-12">${dayName}</span>
                    <div class="flex items-center gap-2 ${info.color} text-2xl w-16 justify-center">
                        <i class="ph-fill ${info.icon}"></i>
                    </div>
                    <div class="flex items-center gap-4 font-bold w-24 justify-end">
                        <span class="text-slate-900">${maxTemp}°</span>
                        <span class="text-slate-400">${minTemp}°</span>
                    </div>
                </div>
            `;
            forecastContainer.innerHTML += html;
        }
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        
        // Show error state
        document.getElementById('weather-content').classList.add('hidden');
        document.getElementById('forecast-content').classList.add('hidden');
        
        const errorState = document.getElementById('error-state');
        const errorMessage = document.getElementById('error-message');
        
        errorState.classList.remove('hidden');
        // Ensure flex layout is maintained when showing
        errorState.classList.add('flex');
        
        errorMessage.innerText = error.message || 'Please check your connection and try again.';
    }
}

document.addEventListener('DOMContentLoaded', fetchWeather);
