import { getApp } from '@shack-js/runner-express'

const port = process.env.PORT || 3000
  ;
(async () => {
  let app = await getApp({ extension: '.js' })
  app.listen(port, () => console.log('started on port: 3000'))
})()