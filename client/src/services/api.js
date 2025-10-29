import axios from 'axios'

export const api = axios.create({
  baseURL: "http://localhost:4000/api"
})

export function setAuthToken(token){
  if (token){
    localStorage.setItem('cinema_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function getToken(){
  return localStorage.getItem('cinema_token')
}

export function clearToken(){
  localStorage.removeItem('cinema_token')
  delete api.defaults.headers.common['Authorization']
}
