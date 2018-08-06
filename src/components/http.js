'use strict'

import axios from 'axios'
import vc from 'vue-cookie'
import ele from 'element-ui'
// import consts from '@/common/consts'
// import configs from '@/common/config.js'

let http = {

};
http.title = function (title) {
  title = title || 'editor demo';
  window.document.title = title;
};

const ajaxUrl = 'https://sign.fangxinqian.cn:2333/';
const onlineSocketUrl = 'ws://192.168.1.131:8989/onlineSocket';
const convertingResultSocket = 'ws://192.168.1.131:8989/convertingSocket/';

http.ajaxUrl = ajaxUrl;
http.onlineSocketUrl = onlineSocketUrl;
http.convertingResultSocket = convertingResultSocket;

http.ajax = axios.create({
  baseURL: ajaxUrl,
  timeout: 30000
});

axios.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

axios.interceptors.response.use(response => {
  return response
}, error => {
  return Promise.resolve(error.response)
})

function checkStatus (response) {
  // loading
  // 如果http状态码正常，则直接返回数据
  if (response && (response.status === 200 || response.status === 304 || response.status === 400)) {
    return response
    // 如果不需要除了data之外的数据，可以直接 return response.data
  }
  ele.Message('网络异常')
  // 异常状态下，把错误信息返回去
  return {
    status: -404,
    msg: '网络异常'
  }
}

function checkCode (res) {
  // 如果code异常(这里已经包括网络错误，服务器错误，后端抛出的错误)，可以弹出一个错误提示，告诉用户
  // if (res.status === -404) {
  //   alert(res.msg);
  // }
  // if (res.data && (res.data.status != 20)) {
  //   ele.Message(res.data.message, { duration: 1000 })
  // }
  return res
}
http.post = function (url, data) {
  let token = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).token:'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxNzc1NDAxODgxMiIsImF1ZCI6IndlYiIsImlwIjpudWxsLCJleHAiOjE1MzQxMjg1MTMsInVzZXJpZCI6bnVsbCwiaWF0IjoxNTMzNTIzNzEzfQ.ZMIfD2_mtTxk4s_X-A-36JJ7QdEQ6PIWmTL-0KSHvG6c7PcobI8jfkmAGTPqiCWBAmj0szxcCK_kQX-_puNtBw'
  let companyid = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).companyid:''
  let userid = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).userid:''
  if (!data) {
    data = { token:token,companyid:companyid, userid: userid }
  } else {
    data.token = token
    data.userid = userid
    data.companyid = companyid
  }
  return axios({
    method: 'post',
    baseURL: ajaxUrl,
    url,
    data: data,
    timeout: 60000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      'Authorization': 'Bearer '+ token
    }
  }).then(
    (response) => {
      return checkStatus(response)
    }
  ).then(
    (res) => {
      return checkCode(res)
    }
  )
}
http.get = function (url, params) {
  let token = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).token:''
  let userid = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).userid:''
  let companyid = vc.get('userInfo')? JSON.parse(vc.get('userInfo')).companyid:''
  if (!params) {
    params = { token:token,companyid:companyid, userid: userid }
  } else {
    params.token = token
    params.userid = userid
    params.companyid = companyid
  }
  return axios({
    method: 'post',
    // baseURL: process.env.BASE_API,
    baseURL: ajaxUrl,
    url,
    data:params, // get 请求时带的参数
    timeout: 60000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      'Authorization': 'Bearer '+ token
    }
  }).then(
    (response) => {
      return checkStatus(response)
    }
  ).then(
    (res) => {
      return checkCode(res)
    }
  )
}
export default http;
