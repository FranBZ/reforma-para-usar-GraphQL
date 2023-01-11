import fs from 'fs'
import { v4 as prodID } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbProducts = path.join(__dirname, '../database/products.txt')

const administrador = true

import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

const schema = buildSchema(`
  input ProductsInput {
    name: String,
    price: Float,
    urlImage: String,
    description: String,
    code: Int,
    stock: Int
  }
  type Product {
    id: String
    name: String,
    price: Float,
    urlImage: String,
    description: String,
    code: Int,
    stock: Int,
    timestamp: Int
  }
  type Query {
    getProducts: [Product],
    getProductById(id: ID!): Product
  }
  type Mutation {
    saveProduct(datos: ProductsInput): Product
    updateProductById(id: String, datos: ProductsInput): Product,
    deleteProductById(id: String): Product,
  }
`);

const readAndParseFile = async (file) => {  // Esta funcion se utiliza para leer el archivo y parsear a JSON la informacion, para su posterior uso

    try {
        const data = await fs.promises.readFile(file, 'utf-8', (err, data) => {         // Consultamos por la informacion
            if (err) throw err
            return data
        })
        return JSON.parse(data)                                                         // Retornamos la informacion parseada
    } catch (error) {
        console.error(`El error es: ${error}`)
    }
}

const getProducts = async () => {  // Esta funcion devuelve un producto segun su ID
    try {
        const dbData = await readAndParseFile(dbProducts)                     // Nos traemos la info parseada a JSON de la db
        return dbData                                                           // devolvemos todos los productos
    } catch (error) {
        console.error(`El error es: ${error}`)
    }
}

const getProductById = async (id) => {  // Esta funcion devuelve un producto segun su ID
    try {
        const dbData = await readAndParseFile(dbProducts)                     // Nos traemos la info parseada a JSON de la db
        const info = dbData.find(product => product.id == id.id)             // Buscamos por ID y lo guardamos en una variable
        if (info) {                                                       // Comprobamos si existe informacion y retornamos
            return info
        } else {
            return { error: 'producto no encontrado' }
        }
    } catch (error) {
        console.error(`El error es: ${error}`)
    }
}

const saveProduct = async (datos) => {        // Guarda un prodcuto nuevo
    if (administrador == true) {
        const { name, price, urlImage, description, code, stock } = JSON.parse(JSON.stringify(datos.datos))                            // Tomamos el cuerpo
        if (!name || !price || !urlImage || !description || !code || !stock) {                          // Comprobamos que el cuerpo este completo
            return { error: 'por favor ingrese todos los datos del producto' }

        } else {

            const product = { name, price, urlImage, description, code, stock }                                                                  // Tomamos el cuerpo 

            try {
                const dbData = await readAndParseFile(dbProducts)                                         // Nos traemos la info parseada a JSON del archivo leido
                product.id = prodID()                                                                     // Insertamos el ID en el producto
                product.timeStamp = Date.now()                                                            // Insertamos el timeStamp
                dbData.push(product)                                                                      // Pusheamos el producto en el array
                await fs.promises.writeFile(dbProducts, JSON.stringify(dbData, null, 2), err => {         // Escribimos el archivo
                    if (err) throw err
                })
                return product
            } catch (error) {
                console.error(`El error es: ${error}`)
            }
        }
    } else {
        return { messaje: 'usted no tiene permisos para consultar esta url' }
    }
}

const updateProductById = async (data) => {  // Recibe y actualiza un producto según su id.
    if (administrador == true) { 

        if (!data.datos.name || !data.datos.price || !data.datos.urlImage || !data.datos.description || !data.datos.code || !data.datos.stock) {                    // Comprobamos que el cuerpo este completo
            return { error: 'por favor ingrese todos los datos del producto' }
        } else {
            try {
                const dbData = await readAndParseFile(dbProducts)
                let contador = 0
                let producto
                for (let prod = 0; prod < dbData.length; prod++) {                    // Recorremos el array de productos, en caso que coincidan los ID lo actualizamos
                    if (dbData[prod].id == data.id) {
                        dbData[prod].name = data.datos.name
                        dbData[prod].price = data.datos.price
                        dbData[prod].urlImage = data.datos.urlImage
                        dbData[prod].description = data.datos.description
                        dbData[prod].code = data.datos.code
                        dbData[prod].stock = data.datos.stock
                        dbData[prod].timeStamp = Date.now()
                        contador += 1
                        producto = dbData[prod]
                        break
                    }
                }
                if (contador != 0) {
                    await fs.promises.writeFile(dbProducts, JSON.stringify(dbData, null, 2), err => {    // En caso de encontrar coincidencias escribimos el archivo
                        if (err) throw err
                    })
                    return producto
                } else {
                    return { error: 'producto no encontrado' }                         // En caso que no haya coincidencias retornamos el error
                }
            } catch (error) {
                console.error(`El error es: ${error}`)
            }
        }
    } else {
        return { messaje: 'usted no tiene permisos para consultar esta url' }
    }
}

const deleteProductById = async (id) => {   // Esta funcion elimina un producto segun su ID
    if (administrador == true) {                                                                      // Tomamos el ID
        try {
            const dbData = await readAndParseFile(dbProducts)
            const pordIndex = dbData.findIndex(product => product.id == id.id)                             // Buscamos el producto por su id y tomamos el indice del array
            let prod
            if (pordIndex != -1) {  
                prod = dbData[pordIndex]                                                                   // Si encuentra 
                dbData.splice(pordIndex, 1)                                                             // Borra el producto
                await fs.promises.writeFile(dbProducts, JSON.stringify(dbData, null, 2), err => {       // Escribimos la nueva db
                    if (err) throw err
                })
                return prod
            } else {
                return { error: 'producto no encontrado' }
            }

        } catch (error) {
            console.error(`El error es: ${error}`)
        }
    } else {
        return { messaje: 'usted no tiene permisos para consultar esta url' }
    }
}

export const graphqlProductController = graphqlHTTP({
    schema: schema,
    rootValue: {
        getProducts: getProducts,
        getProductById: getProductById,
        saveProduct: saveProduct,
        updateProductById: updateProductById,
        deleteProductById: deleteProductById
    },
    graphiql: true,
})