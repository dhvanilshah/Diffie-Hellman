import React, { Component } from 'react';
import { Navbar, NavbarBrand, UncontrolledTooltip} from 'reactstrap';

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
  componentWillMount() {

  }
  componentDidMount() {
    if (document.cookie.match(/^(.*;)?\s*USER_ID\s*=\s*[^;]+(.*)?$/)){
        console.log('Already Registered')
    } else {
      this.setVariable();
      fetch('http://192.168.0.182:8080/connect/ask', {
        method: 'GET',
      })
        .then(response => response.json())
        .then(data => {
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
          .then(response => {console.log(response)});
          localStorage.setItem('secret', parseInt(s));
        });
    }
  }

  setVariable(){
    forge.prime.generateProbablePrime(5, function(err, num) {
      this.setState({key: num.toString(10)});
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
