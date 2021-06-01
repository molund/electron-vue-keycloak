import axios from "axios";

const APIUrl = process.env.VUE_APP_BASE_URL;

const djangoAPI = axios.create({
  baseURL: APIUrl,
  headers: { "Content-Type": "application/json" }
});

export default djangoAPI;
