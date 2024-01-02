import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export function getAnnotations(imageIdx, splitIdx) {
  return axios.get(`${BASE_URL}/annotations/${imageIdx}/${splitIdx}`);
}

export function postAnnotation(annotationData) {
  return axios.post(`${BASE_URL}/annotations`, annotationData);
}


