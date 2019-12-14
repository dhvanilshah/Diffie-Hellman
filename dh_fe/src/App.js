import React, { Component } from 'react';
import { Navbar, NavbarBrand, UncontrolledTooltip } from 'reactstrap';

import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import BigNumber from "bignumber.js"

var forge = require('node-forge');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      key: ''
    };
  }
  encrypt = (message, key) => {
    var keyBytes = forge.util.createBuffer(key.toString('Binary'));
    var ivBytes = forge.random.getBytesSync(16);
    // Cipher
    var cipher = forge.cipher.createCipher('AES-CBC', keyBytes);
    cipher.start({ iv: ivBytes });
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    // Convert encrypted msg and IV to Hex
    var encryptedHex = cipher.output.toHex();
    var ivHex = forge.util.bytesToHex(ivBytes);
    console.log(encryptedHex);
    console.log(ivHex);

    fetch('http://192.168.0.182:8080/msg/rx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'msg': encryptedHex,
        'id': localStorage.getItem('user_id'),
        'iv': ivHex,
      }),
    }).then(response => console.log(response))
  }


  componentWillMount() {

  }
  componentDidMount() {
    if (localStorage.getItem('user_id') != null) {
      console.log('Already Registered')
      var key = localStorage.getItem('secret');
      var buffer = Buffer.alloc(16);
      buffer.fill(key);
      this.encrypt("hello", buffer);
    } else {

      this.setVariable();
      fetch('http://192.168.0.182:8080/connect/ask', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
          localStorage.setItem('user_id', data['id']);
          document.cookie = "USER_ID=" + data['id'];
          //console.log(parseInt(localStorage.getItem('key')));
          var B = BigNumber(data['g'])
            .exponentiatedBy(parseInt(localStorage.getItem('public')))
            .modulo(data['p']).toString()
          var s = BigNumber(data['key'])
            .exponentiatedBy(parseInt(localStorage.getItem('public')))
            .modulo(data['p']).toString()
          fetch('http://192.168.0.182:8080/connect/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              'B': B,
              'id': data['id']
            }),
          })
            .then(response => { console.log(response) });
          localStorage.setItem('secret', parseInt(s));
        });
    }
  }

  setVariable() {
    forge.prime.generateProbablePrime(5, function (err, num) {
      this.setState({ key: num.toString(10) });
      console.log(num.toString(10))
      localStorage.setItem('public', num.toString(10));
    }.bind(this));
  }
  render() {
    const {
      username
    } = this.state;
    return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Cybersecurity Final Project: DH Message Logger</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {this.state.key}
        </div>
      </React.Fragment>
    );
  }

}

export default App;
