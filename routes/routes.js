//Load the MariaDB getConnection function
const getConnection = require('../dbconfig');

// Load the auth file 
const service = require('../services/auth')


//Tip JavaScript: we can define a function or a variable as
//'name' = 'input' => 'output/action'
//C++ Translation: name(input){ output/action }
const router = app => {

  //When starting the server, validate that the database is accessible
  console.log("Validating connection...");
  try {
    const conn = getConnection()
    conn.end();
  }
  catch (err){
    conn.end()
    console.error("Failed to connect due to error: " + err);
    return;
  }
  console.log("Validation succeed!");

  //-----API REQUESTS-------

  // Petición para hacer pruebas con la app
  app.get('/api/prueba', (request, response) => {
    const username = request.body.username
    const password = request.body.password
    response.status(200).send({username, password})
    console.log(username, password)
  })

  app.get('/api/privado', (request, response) => {
    /*if(!request.headers.authorization){
      return response.status(403).send({message: 'No tienes autorizacion'})
    }
    header = request.headers.authorization.split(' ')[1]
    console.log(header)
    var decoded = jwt.decode(header, config.SECRET_TOKEN)
    response.send(decoded.sub)
    console.log(decoded)*/
    var token = service.decodeToken(request, response)
    response.status(200).send(token.sub)
    console.log(token.sub)
  });

  //Display all information from all users (ésta habrá que quitarla, es para pruebas)
  app.get('/api/users', (request, response) => {
    const conn = getConnection()
    conn.query("SELECT * FROM users", (err,res) => {
      if (err) {
        console.error(err);
        return response.status(500).send({
          message: "error intern en el sevidor"
        });
      }
      response.send(res);
      conn.end();
    });
  });

  //Display all information from user with the given id
  app.get('/api/users/:id', (request, response) => {
    const id = request.params.id;
    const conn = getConnection()
    conn.query("SELECT * FROM users WHERE id=?",id, (err,res) => {
      if (err) {
        console.error(err);
        return response.status(500).send({
          message: "error intern en el sevidor"
        });
      }
      response.send(res);
      conn.end();
    });
  });

  //Log in with a given user and password. Return a token.
  app.post('/api/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const conn = getConnection();
    conn.query("SELECT username FROM users WHERE username=? AND password=?",[username,password],(err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      //username doesn't exist
      if (Object.keys(res).length === 0) {
        console.log(res);
        conn.end();
        return response.status(400).send({
          message: "credencials incorrectes"
        });
      }

      //valid authentication
      console.log(res)
      return response.status(200).send({
        token: service.createToken(username)
      });
    });
  });

  //Sign up a user with the given params in the body
  app.post('/api/signup', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const dni = request.body.dni;
    const name = request.body.name;
    const lastname = request.body.lastname;
    const phone = request.body.phone;
    const email = request.body.email;
    const 
    if (!username || !password || !dni || !name || !lastname || !phone || !email){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    //Request a new connection
    const conn = getConnection()
    //Already existing username?
    conn.query("SELECT username FROM users WHERE username=?",username,(err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      //Already existing username
      if (!(Object.keys(res).length === 0)) {
        conn.end();
        return response.status(400).send({
          message: "usuari ja existent"
        });
      }
    });
    //Add the new user
    conn.query("INSERT INTO users (username,password,dni,name,lastname,phone,email) VALUES (?,?,?,?,?,?,?)",[username,password,dni,name,lastname,phone,email], (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern del servidor"
        });
      }
      conn.end();
      console.log(res)
      return response.send({
        message: "usuari creat correctament"
      });
    });
  });

  //Delete an existing user
  app.delete('/api/remove_user', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response) 
    const conn = getConnection()
    conn.query("DELETE FROM users WHERE username=?",tokenDecoded.sub, (err,res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        });
      }
      //If no rows were affected, wrong username or password were given
      if (res["affectedRows"] === 0) {
        conn.end();
        return response.status(400).send({
          message: "credencials incorrectes"
        });
      }
      conn.end();
      return response.send({
        message: "usuari eliminat"
      });

    });//end query
    //conn.query("DELETE FROM users WHERE username=?",[username,password], (err,res) => {
  });


  //Afegir un coche a un usuario

  app.post('/api/afegir-coche', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    matricula = request.body.matricula
    puede_calcular = request.body.puede_calcular
    marca = request.body.marca
    modelo = request.body.modelo

    if(!matricula || !puede_calcular || !marca || !modelo){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      })
    }

    const conn = getConnection()
    conn.query("INSERT INTO coches (matricula, usuarioID, puede_calcular, marca, modelo) VALUES (?,?,?,?,?)", [matricula, tokenDecoded.sub, puede_calcular, marca, modelo], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0){
        conn.end()
        return response.status(200).send({
          message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        status: 0,
        message: "Coche introduit correctament"
      })
    })
  })

  //Obtenir informació sobre els coches d'un usuari donat (matricula, marca, modelo)
  app.get('/api/informacio-coches-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT matricula, marca, modelo FROM coches WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        })
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        satus: 0,
        res
      })
    })
  })


  // Petició per obtenir les reserves del usuari
  app.get('/api/obtenir-reserves-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    var matricula = request.body.matricula
    const conn = getConnection()

    conn.query("SELECT matricula FROM coches where usuarioID = ? AND matricula = ?", [tokenDecoded.sub, matricula], (err, res) => {
      if(err) {
        console.error(err)
        conn.end()
        return response.status(500).send({message: "error intern al servidor"})
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "No tens registrada aquesta matricula"
        })
      }
    })

    conn.query("SELECT * FROM reserva WHERE matricula = ?", matricula, (err, res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        })
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "No hi ha reserves per aquesta matricula"
        })
      }
      return response.status(200).send({
        satus: 0,
        res
      })
    })
  })

  //Reserva
  app.post('/api/reserva', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    matricula = request.body.matricula
    parkingID = request.body.parkingID
    if (!matricula || !parkingID){
      return response.status(400).send({
        message: "existeixen camps obligatoris buits"
      });
    }
    const conn = getConnection()
      //Comprobacion coche es de usuario
      conn.query("SELECT * FROM coches WHERE usuarioID=? AND matricula=?",[tokenDecoded.sub,matricula], (err,res) => {
        if (err) {
          console.error(err);
          conn.end();
          return response.status(500).send({
            message: "error intern en el servidor"
          });
        }
        if(Object.keys(res).length === 0){
            conn.end()
            return response.status(200).send({
              status: 1,
              message: "dades incorrectes"
            })
        }
      });
      // Comprovació existeix reserva
      conn.query("SELECT * from reserva WHERE matricula = ? AND parkingID = ?", [matricula, parkingID], (err, res) => {
        if(err){
          console.error(err);
          conn.end();
          return response.status(500).send({
            message: "error intern en el servidor"
          });
        }
        if(!(Object.keys(res).length === 0)){
          conn.end()
          return response.status(200).send({
            status: 1,
            message: "existeix reserva amb aquesta matricula i en aquest parking"
          })
        }
      })
      //Reserva una plaza aleatoria
      conn.query("INSERT INTO reserva (parkingID, matricula, hora_entrada) values (?,?, NOW())",[parkingID, matricula], (err,res) => {
        if (err) {
          console.error(err);
          conn.end();
          return response.status(500).send({
            message: "error intern en el servidor"
          });
        }
        //If no rows were affected, wrong username or password were given
        if (res["affectedRows"] === 0) {
          conn.end();
          return response.status(200).send({
            status: 1,
            message: "no hi ha places disponibles"
          });
        }
        conn.end();
        return response.send({
          status: 0,
          message: "reserva realitzada correctament",
        });
  
      });
    });

  
 //Eliminar reserva d'un usuari donada una matricula i el se usuariID 
 app.delete('/api/eliminar-reserva-usuari', (request, response) => {
  const tokenDecoded = service.decodeToken(request, response)
  const matricula = request.body.matricula
  const conn = getConnection()
  conn.query("SELECT matricula FROM coches WHERE usuarioID = ? AND matricula = ?", [tokenDecoded.sub, matricula], (err, res) => {
    if (err) {
      console.error(err);
      conn.end();
      return response.status(500).send({
        message: "error intern en el servidor"
      })
    }
    if(Object.keys(res).length === 0){
      conn.end()
      return response.status(200).send({
      status: 1,
      message: "no tens cap cotxe amb aquesta matricula enregistrat"
      })
    } 
    conn.query("DELETE FROM reserva WHERE matricula = ?", matricula, (err, res) => {
    if(err){
      console.error(err);
      conn.end();
      return response.status(500).send({
        message: "error intern en el servidor"
      })
    }
    // Matricula introduida es erronea
    if(res["affectedRows"] === 0){
      conn.end()
      return response.status(200).send({
        status: 1,
        message: "matricula introduida no valida"
      })
    }
    conn.end()
    return response.status(200).send({
      status: 0,
      message: "reserva eliminada correctament"
    })
    })
  })
})


//Obtenir configuracio de l'usuari 
app.get('/api/obtenir-configuracio-usuari', (request, response) => {
  const tokenDecoded = service.decodeToken(request, response)
  const conn = getConnection()
  conn.query("SELECT nombre, apellidos, usuario, telefono, mail, AES_DECRYPT(UNHEX(pass), 'funcionaplis') AS password FROM usuarios WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
    if (err) {
      console.error(err);
      conn.end();
      return response.status(500).send({
        message: "error intern en el servidor"
      })
    }
    if(Object.keys(res).length === 0){
      conn.end()
      return response.status(200).send({
      status: 1,
      message: "no existeix cap usuario amb aquest identificador"
      })
    }
    return response.status(200).send({
      status: 0,
      res
    })
  })
})



//Actualitzar parametre puede_calcular de cotxes
app.get('/api/actualitzar-cesio-computacio', (request, response) => {
  const tokenDecoded = service.decodeToken(request, response)
  const matricula = request.body.matricula
  const puede_calcular = request.body.puede_calcular
  //Comprova si la matricula es del usuari donat
  conn.query("SELECT matricula FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
    if(err){
      console.error(err)
      conn.end()
      return response.status(500).send({
        message: "error intern del servidor"
      })
    }
    //L'usuari no te cap cotxe amb aquesta matricula registrat
    if(Object.keys(res).length === 0){
      conn.end()
      return response.status(200).send({
      status: 1,
      message: "no tens cap cotxe registrat amb aquesta matricula"
      })
    }
    //Fem l'actualitzacio de la cesio de computacio perque la matricula pertany a l'usuari
    conn.query("UPDATE coches SET puede_calcular = ? WHERE matricula = ?", [puede_calcular, matricula], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0){
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        status: 0,
        message: "Actualització realitzada correctament"
      })
    })
  })
})


//Obtenir totes les marcas i models de cotxe de la bd
app.get('/api/obtenir-marcas', (request, response) => {
  const conn = getConnection()
  conn.query("SELECT * FROM models_coches", (err, res) => {
    if(err){
      console.error(err)
      conn.end()
      return response.status(500).send({
        message: "error intern del servidor"
      })
    }
    conn.end()
    return response.status(200).send({
      res
    })
  })
})



  //Obtenir totes les reserves de l'usuari 
  app.get('/api/obtenir-reserves-usuari', (request, response) => {
    var tokenDecoded = service.decodeToken(request, response)
    const conn = getConnection()
    conn.query("SELECT matricula FROM coches WHERE usuarioID = ?", tokenDecoded.sub, (err, res) => {
      if (err) {
        console.error(err);
        conn.end();
        return response.status(500).send({
          message: "error intern en el servidor"
        })
      }
      if(Object.keys(res).length === 0){
        conn.end()
        return response.status(200).send({
        status: 1,
        message: "no tens cap cotxe registrat"
        })
      }
      console.log(res)
      return response.status(200).send({
        status: 0,
        res
      })
    })
  })

  //-----INFRAESTRUCTURA REQUESTS----//

  
    //Comprovar si un usuari te un coche passat el usuariID i la matricula
    app.get('/api/comprovar-coche-usuari', (request, response) => {
      //var usuarioID = request.body.usuarioID
      var matricula = request.body.matricula
      const conn = getConnection()
      conn.query("SELECT usuarioID FROM coches WHERE matricula = ?", matricula, (err, res) => {
        if (err) {
          console.error(err);
          conn.end();
          return response.status(500).send({
            message: "error intern en el servidor"
          })
        }
        if(Object.keys(res).length === 0){
          conn.end()
          return response.status(200).send({
          status: 1,
          message: "No existeix cap coche amb aquesta matricula per aquest usuari"
          })
        }
        return response.status(200).send({
          status: 0,
          message: "Existeix un coche amb aquesta matricula per aquest usuari"
        })
      })
    })



  app.get('/api/comprovar-reserva-coche', (request, response) => {
    const matricula = request.body.matricula
    const parkingID = request.body.parkingID
    const conn = getConnection()
    conn.query('SELECT matricula FROM reserva WHERE matricula = ? AND parkingID = ?', [matricula, parkingID], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      // No existeix cap usuari amb aquesta matricula 
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        status: 0,
        message: "Hi ha un reserva per aquesta matricula"
      }) 
    })
  })

  app.get('/api/comprovar-estat-coche', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query('SELECT estado_coche FROM plazas WHERE matricula = ?', matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      // No existeix cap usuari amb aquesta matricula 
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      // L'estat del coche es 0
      if(res["affectedRows"] === 0){
        return response.status(200).send({
          estat_coche: 0,
          message: "L'estat del coche es 0"
        })
      }
      return response.status(200).send({
        estat_coche: 1,
        message: "L'estat del coche es 1"
      })
    })
  })


  app.post('/api/recursos-parking', (request, response) => {
    const clockRate = request.body.clockRate
    const cpuCores = request.body.cpuCores
    const ram = request.body.ram
    const hddSpace = request.body.hddSpace
    const parkingID = request.body.parkingID
    
    const conn = getConnection()
    conn.query('UPDATE recursos SET clockRate = ?, cpuCores = ?, ram = ?, hddSPpace = ? WHERE parkingID = ?', [clockRate, cpuCores, ram, hddSpace, parkingID], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(400).send({
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha actualitzat be"
      })
    })
  })

  app.post('/api/introduir-usuari-parking', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 1, matricula = ?, hora_inicio = NOW(), pagado = 0, estado_coche = (SELECT puede_calcular FROM coches WHERE matricula = ?) WHERE estado = 0 LIMIT 1", [matricula, matricula], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(400).send({
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha introduit be"
      })
    })
  })

  app.post('/api/elimina-usuari-parking', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado = 0, matricula = NULL, hora_inicio = NULL, pagado = NULL, estado_coche = NULL WHERE matricula = ?", matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern del servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(400).send({
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "S'ha eliminat be"
      })
    })
  })

  //Actualitzar estat UsuariParking. Actualitza l'estat depenent de si esta computant o lliure.
  app.post('/api/actualitzar-estat-usuari', (request, response) => {                                                                             
    const estado_coche = request.body.estat
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query("UPDATE plazas SET estado_coche = ? where matricula = ?", [estado_coche, matricula], (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern al servidor"
        })
      }
      if(res["affectedRows"] === 0) {
        conn.end()
        return response.status(400).send({
          message: "dades incorrectes"
        })
      }
      conn.end()
      return response.status(200).send({
        status: 0,
        message: "L'estat s'ha actualitzat be"
      })
    })
  })

  app.get('/api/comprovar-pagament', (request, response) => {
    const matricula = request.body.matricula
    const conn = getConnection()
    conn.query("SELECT pagado FROM plazas WHERE matricula = ?", matricula, (err, res) => {
      if(err){
        console.error(err)
        conn.end()
        return response.status(500).send({
          message: "error intern al servidor"
        })
      }
      // No existeix cap usuari amb aquesta matricula 
      if(Object.keys(res).length === 0){
        console.log(res)
        conn.end()
        return response.status(200).send({
          status: 1,
          message: "dades incorrectes"
        })
      }
      return response.status(200).send({
        status: 0,
        message: "L'usuari a efectuat el pagament"
      })
    })

  })

};

//Export the router
module.exports = router;




















 //Afegir un coche a un usuari

 app.post('/api/afegir-coche', (request, response) => {
  var tokenDecoded = service.decodeToken(request, response)
  matricula = request.body.matricula
  puede_calcular = request.body.puede_calcular
  marca = request.body.marca
  modelo = request.body.modelo

  if(!matricula || !puede_calcular || !marca || !modelo){
     return response.status(400).send({
       message: "existeixen camps obligatoris buits"
     })
   }
  //Establim connexió
  const conn = getConnection()

  //Comprovació de que el coche que vol introduir l'usuari no el te ja a la base de dades
  conn.query("SELECT matricula FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
    if(err){
      console.error(err)
      conn.end()
      return response.status(500).send({
        message: "error intern del servidor"
      })
    }
    if(!(Object.keys(res).length === 0)){
      conn.end()
      return response.status(200).send({
        status: 1,
        message: "El coche ja el tens enregistrat"
      })
    }
  })
  console.log("Estoy llegando")
  conn.query("INSERT INTO coches (matricula, usuarioID, puede_calcular, marca, modelo) VALUES (?,?,?,?,?)", [matricula, tokenDecoded.sub, puede_calcular, marca, modelo], (err, res) => {
    if(err){
      console.error(err)
      conn.end()
      return response.status(500).send({
        message: "error intern del servidor"
      })
    }
    if(res["affectedRows"] === 0){
      conn.end()
      return response.status(200).send({
        status: 1,
        message: "dades incorrectes"
      })
    }
    return response.status(200).send({
      status: 0,
      message: "Coche introduit correctament"
    })
  })
})



 //Eliminar coche d'un usuari
 app.delete('/api/eliminar-coche-usuari', (request, response) => {
  var tokenDecoded = service.decodeToken(request, response)
  const matricula = request.body.matricula
  if(!matricula){
    return response.status(400).send({
      message: "existeixen camps obligatoris buits"
    })
  }

  const conn = getConnection()
  conn.query("DELETE FROM coches WHERE matricula = ? AND usuarioID = ?", [matricula, tokenDecoded.sub], (err, res) => {
    if(err){
      console.error(err)
      conn.end()
      return response.status(500).send({
        message: "error intern del servidor"
      })
    }
    // Matricula introduida es erronea
    if(res["affectedRows"] === 0){
      conn.end()
      return response.status(200).send({
        status: 1,
        message: "matricula introduida no valida"
      })
    }
    conn.end()
    return response.status(200).send({
      status: 0,
      message: "coche eliminat correctament"
    })
  })
})



