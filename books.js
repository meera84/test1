// load express
const express = require('express')

// SQL
//const SQL_GET_APP_CATEGORIES = 'select * from book2018';
const SQL_GET_BOOKS = 'select distinct left(title,1) as letter from book2018 order by letter ASC';
const SQL_GET_BOOKS_LETTERS = 'select book_id ,title from book2018 where title like ? limit ? offset ?';
const SQL_GET_BOOK_DETAILS = 'select * from book2018 where book_id = ?';
//const SQL_GET_APP_BY_APPID = 'select * from apps where app_id = ?'

module.exports = function(p) {

    const router = express.Router()
    const pool = p



//getting the list of buttons for landing page. Tagged to the starting letter of book titles
    router.get('/', async (req, resp) => {

        const conn = await pool.getConnection()

        try {
            const results = await conn.query(SQL_GET_BOOKS)
            const bookletter = results[0].map(v=>v.letter)

            resp.status(200)
            resp.type('text/html')
            resp.render('index', { 
                bookletter
            
            })

        } catch(e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        } finally {
            conn.release()
        }

    })


    //getting the list of titles starting with selected letter
    router.get('/books/:q', async (req, resp) => {

        const q= req.params.q
        const offset = parseInt(req.query['offset']) || 0
        const limit = 10
    
        const conn = await pool.getConnection()
    
        try {
            const results = await conn.query(SQL_GET_BOOKS_LETTERS, [`${q}%`,limit,offset ])
            resp.status(200)
            resp.type('text/html')
            resp.render('letters', { 
                letters: results[0], 
                q,
                prevOffset: Math.max(0, offset - limit),
                nextOffset: offset + limit})
        } catch(e) {
            console.error('ERROR: ', e)
            resp.status(500)
            resp.end()
        } finally {
            conn.release()
        }
    })

//getting the details of the selected book
    router.get('/books/:book_id', async (req, resp) => {
        console.log('did we readch here')

        const book_id= req.params.book_id
        console.log(book_id)
    
        const conn = await pool.getConnection()
    
        try {
            const [ result, _ ] = await conn.query(SQL_GET_BOOK_DETAILS, [ book_id])
            //const results = await conn.query(SQL_GET_BOOK_DETAILS, [book_id])
            console.log(results[0])
            resp.status(200)
            resp.type('text/html')
            resp.render('details', { book: result[0]})
        } catch(e) {
            console.error('ERROR: ', e)
            resp.status(500)
            resp.end()
        } finally {
            conn.release()
        }
    })


     //hasSite: !!result[0].official_site  (Removed this for a while)
    

    /*

    router.get('/app/:appId', async (req, resp) => {
        const appId = req.params['appId']

        const conn = await pool.getConnection()

        try {
            const results = await conn.query(SQL_GET_APP_BY_APPID, [ appId ])
            const recs = results[0]

            if (recs.length <= 0) {
                //404!
                resp.status(404)
                resp.type('text/html')
                resp.send(`Not found: ${appId}`)
                return
            }

            resp.status(200)
            resp.format({
                'text/html': () => {
                    resp.type('text/html')
                    resp.render('app', { app: recs[0] })
                },
                'application/json': () => {
                    resp.type('application/json')
                    resp.json(recs[0])
                },
                'default': () => {
                    resp.type('text/plain')
                    resp.send(JSON.stringify(recs[0]))
                }
            })

        } catch(e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        } finally {
            conn.release()
        }
    })

    router.get('/category', async (req, resp) => {

        const conn = await pool.getConnection()

        try {
            const results = await conn.query(SQL_GET_APP_CATEGORIES)
            const cats = results[0].map(v => v.category)

            resp.status(200)
            resp.type('text/html')
            resp.render('index', { category: cats })

        } catch(e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        } finally {
            conn.release()
        }
    })*/

    return (router)
}