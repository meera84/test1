// load express
const express = require('express')
const mysql = require('mysql2/promise')
const fetch = require('node-fetch')
const withQuery = require('with-query').default

// SQL
//const SQL_GET_APP_CATEGORIES = 'select * from book2018';
const SQL_GET_BOOKS = 'select distinct left(title,1) as letter from book2018 order by letter ASC';
const SQL_GET_BOOKS_LETTERS = 'select book_id ,title from book2018 where title like ? limit ? offset ?';
const SQL_GET_BOOK_DETAILS = 'select * from book2018 where book_id = ?';
const SQL_LIST_OF_BOOKS_PER_LETTER = 'select count(*) as totalnum from book2018 where title like ?';


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
        console.log("hello")
        const q= req.params.q
        const offset = parseInt(req.query['offset']) || 0
        const limit = 10
        const conn = await pool.getConnection()
    
        try {
            const results = await conn.query(SQL_GET_BOOKS_LETTERS, [`${q}%`,limit,offset ])
            const totalNum = await conn.query(SQL_LIST_OF_BOOKS_PER_LETTER, [`${q}%`])
            const totallist= totalNum[0][0].totalnum
            resp.status(200)
            resp.type('text/html')
            console.log(results[0])
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
    router.get('/books/:q/:book_id', async (req, resp) => {
        console.log('did we readc2h here')

        const book_id= req.params.book_id
        console.log(book_id)
    
        const conn = await pool.getConnection()
    
        try {
            console.log('did we readch here')
            //const [ result, _ ] = await conn.query(SQL_GET_BOOK_DETAILS, [bookid])
            const result = await conn.query(SQL_GET_BOOK_DETAILS, [book_id])
            console.log(result[0])
            const a1=result[0]
            const genres = a1[0].genres.split('|')
            const author = a1[0].authors.split('|')
            
            console.log(genres)
            

            resp.format({
                'text/html': () => {
                    resp.type('text/html')
                    resp.render('details', { book: a1[0],genres,author })
                },
                'application/json': () => {
                    resp.type('application/json')
                    resp.json(a1[0])
                },
                'default': () => {
                    resp.type('text/plain')
                    resp.send(JSON.stringify(a1[0]))
                }
            })
    
        } catch(e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        } finally {
            conn.release()
        }
    


            /*
            resp.status(200)
            resp.type('text/html')
            resp.render('details', {book:a1[0]}
            
            )
        } catch(e) {
            console.error('ERROR: ', e)
            resp.status(500)
            resp.end()
        } finally {
            conn.release()
        }*/
    })


    //getting the details of the selected book
    router.get('/findreview', async (req, resp) => {
        const ENDPOINT = 'https://api.nytimes.com/svc/books/v3/reviews.json'
        const Public_API_KEY = process.env.API_KEY
       
        const title=req.query['title']
        console.log(title)
        
        let url = withQuery(ENDPOINT, {
            title,
            'api-key': Public_API_KEY,
           
        })
        console.log(url)
        let result = await fetch(url)
        result = await result.json()
        console.log(result)
        const copyright = result.copyright
        console.log(copyright)
        const bookreview = result.results
        console.log('bookreview',bookreview)

        if (result.num_results <= 0) {
            //404!
            resp.status(404)
            resp.type('text/html')
            resp.send(`No reviews found for ${title}`)
            return
        }
        resp.status(200)
        resp.type('text/html')
        resp.render ('review',{bookreview, copyright})
        
       
    })

   

    return (router)
}