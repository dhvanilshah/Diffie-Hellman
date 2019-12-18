import React, { Component } from 'react';
import { Menu, Icon, Input, Form, Button, Checkbox} from 'antd';

import './App.css';
import BigNumber from "bignumber.js"
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'

var forge = require('node-forge');
var bigInt = require("big-integer");
const { TextArea } = Input;

const dest = 'http://192.168.2.32:8080';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      key: '',
      text: ''
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

    fetch(dest + '/msg/rx', {
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
  };
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
      }
    });
  };

  rsaencrypt = (m, n, e) => {
    /*
    console.log("m", m.toString())
    console.log("n", n.toString())
    console.log("e", e.toString())
    n = BigNumber(n.toString());
    m = BigNumber(m.toString());
    e = BigNumber(e.toString());
    var temp = m.exponentiatedBy(e);
    console.log('B^e: ', temp.toString());
    console.log('B^e mode n:', temp.mod(n).toString());
    return temp.mod(n);
     */
    return m.modPow(e, n);
  }


  componentWillMount() {

  }
  componentDidMount() {
    if (localStorage.getItem('user_id') != null) {
      console.log('Already Registered')
    } else {
      this.setVariable();
      this.createRSAPair();
      fetch(dest + '/connect/ask', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          localStorage.setItem('user_id', data['id']);
          document.cookie = "USER_ID=" + data['id'];
          var B = BigNumber(data['g'])
            .exponentiatedBy(parseInt(localStorage.getItem('private')))
            .modulo(data['p']).toString();
          console.log(B);
          var s = BigNumber(data['key'])
            .exponentiatedBy(parseInt(localStorage.getItem('private')))
            .modulo(data['p']).toString();

          var e = bigInt.fromArray(data['e'].value, 100);
          var n = bigInt.fromArray(data['n'].value, 100);
          console.log('e: ', e);
          console.log('n: ', n);
          console.log('b: ', bigInt(B));
          console.log('encrypted b: ', this.rsaencrypt(bigInt(B), n, e).toArray(100));

          fetch(dest + '/connect/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              'B': this.rsaencrypt(bigInt(B), n, e).toArray(100),
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
      localStorage.setItem('private', num.toString(10));
    }.bind(this));
  }

  createRSAPair = () => {

  };

  handleChange = (e) => {
    const regex = new RegExp('/>([a-zA-Z0-9]+)<', 'g');
    this.setState({text: e.target.textContent});
  };

  handleSend = (e) => {
    var key = localStorage.getItem('secret');
    var buffer = Buffer.alloc(16);
    buffer.fill(key);
    this.encrypt(this.state.text, buffer);
    console.log();
  };

  render() {
    const {
      username
    } = this.state;
    return (
      <React.Fragment>
        <Menu onClick={this.handleClick} selectedKeys={[this.state.current]} mode="horizontal">
          <Menu.Item key="mail">
            <Icon type="container" />
            Cybersecurity Final Project: Diffie Hellman Message Logger
          </Menu.Item>
        </Menu>
            <TextArea onChange={this.handleChange} style={{marginTop: '2vh', width: '90vw', marginLeft: '2vw'}} rows={4} />
            <Button type="primary" onClick={this.handleSend} htmlType="submit" className="login-form-button" style={{marginTop: '2vh', marginLeft: '2vw'}}>
              Submit
            </Button>
      </React.Fragment>
    );
  }
}

export default App;
