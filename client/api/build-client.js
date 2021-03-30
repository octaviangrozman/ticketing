import axios from "axios";

export default ({ req }) => {
  if (typeof window === "undefined") {
    // we are on the server!
    // requests should be made to
    // http://ingress-nginx-controller.ingress-nginx...
    return axios.create({
      baseURL:
        "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local",
      headers: req.headers, // pass all the headers from browser (e.g. cookie)
    });
  } else {
    // we are on the browser!
    // requests can be made with a base url of ''
    return axios.create({ baseURL: "/" });
  }
};
