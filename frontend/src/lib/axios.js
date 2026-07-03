import axios from 'axios'

export const axiosInstance = axios.create({
    baseURL:import.meta.env.MODE=== "development" ? "http://localhost:5001/api" : "/api",
    withCredentials:true, //sends the cookies with every request
})