import React, { Component } from "react";
import { Menu, Icon, Input, Form, Button, Checkbox } from "antd";

import "./App.css";
import BigNumber from "bignumber.js";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'

var forge = require("node-forge");
var bigInt = require("big-integer");
const { TextArea } = Input;

const dest = "http://192.168.0.182:8080";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      key: "",
      n: "",
      e: "",
      text: "",
      encryptedtx: "",
      ivtx: "",
      decryptmsg: ""
    };
  }
  encrypt = (message, key) => {
    var keyBytes = forge.util.createBuffer(key.toString("Binary"));
    var ivBytes = forge.random.getBytesSync(16);
    // Cipher
    var cipher = forge.cipher.createCipher("AES-CBC", keyBytes);
    cipher.start({ iv: ivBytes });
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    // Convert encrypted msg and IV to Hex
    var encryptedHex = cipher.output.toHex();
    var ivHex = forge.util.bytesToHex(ivBytes);

    this.setState({
      encryptedtx: encryptedHex,
      ivtx: ivHex
    });

    fetch(dest + "/msg/rx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msg: encryptedHex,
        id: localStorage.getItem("user_id"),
        iv: ivHex
      })
    }).then(response => console.log(response));
  };

  decrypt = (encryptedHex, ivHex) => {
    var key = localStorage.getItem("secret");
    var buffer = Buffer.alloc(16);
    buffer.fill(key);
    var keyBytes = forge.util.createBuffer(buffer.toString("Binary"));
    // console.log("Encrypted Hex: ", encryptedHex);
    // console.log("IV Hex:", ivHex);
    // console.log("Secret Key: ", keyBytes);

    var encryptedBytes = forge.util.hexToBytes(encryptedHex);
    var ivBytes = forge.util.hexToBytes(ivHex);
    // Decipher
    var decipher = forge.cipher.createDecipher("AES-CBC", keyBytes);
    decipher.start({ iv: ivBytes });
    decipher.update(forge.util.createBuffer(encryptedBytes));
    var result = decipher.finish();
    if (result == false) {
      // console.log(result);
      this.setState({
        decryptmsg: "Could not decrypt. Possible invalid hex combination"
      });
    } else {
      var msgBytes = decipher.output.toString();
      this.setState({ decryptmsg: msgBytes });
    }
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
      }
    });
  };

  rsaencrypt = (m, n, e) => {
    return m.modPow(e, n);
  };

  componentWillMount() {}
  componentDidMount() {
    if (localStorage.getItem("user_id") != null) {
      console.log("Already Registered");
    } else {
      this.setVariable();
      this.createRSAPair();

      fetch(dest + "/connect/ask", {
        method: "GET"
      })
        .then(response => response.json())
        .then(data => {
          // console.log(data);
          localStorage.setItem("user_id", data["id"]);
          document.cookie = "USER_ID=" + data["id"];
          var B = BigNumber(data["g"])
            .exponentiatedBy(parseInt(localStorage.getItem("private")))
            .modulo(data["p"])
            .toString();

          // console.log(B);
          var s = BigNumber(data["key"])
            .exponentiatedBy(parseInt(localStorage.getItem("private")))
            .modulo(data["p"])
            .toString();

          var e = bigInt.fromArray(data["e"].value, 100);
          var n = bigInt.fromArray(data["n"].value, 100);
          this.setState({ n: n.toString(), e: e.toString() });
          fetch(dest + "/connect/ask", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              B: this.rsaencrypt(bigInt(B), n, e).toArray(100),

              id: data["id"]
            })
          }).then(response => {
            // console.log(response);
          });
          localStorage.setItem("secret", parseInt(s));
        });
    }
  }

  setVariable() {
    forge.prime.generateProbablePrime(
      5,
      function(err, num) {
        this.setState({ key: num.toString(10) });
        // console.log(num.toString(10));
        localStorage.setItem("private", num.toString(10));
      }.bind(this)
    );
  }

  createRSAPair = () => {};

  handleChange = e => {
    const regex = new RegExp("/>([a-zA-Z0-9]+)<", "g");

    this.setState({ text: e.target.value });
  };

  handleChangeDC = e => {
    const regex = new RegExp("/>([a-zA-Z0-9]+)<", "g");
    this.setState({ encrypteddc: e.target.value });
  };
  handleChangeIV = e => {
    const regex = new RegExp("/>([a-zA-Z0-9]+)<", "g");
    this.setState({ encryptediv: e.target.value });
  };

  handleDecrypt = e => {
    this.setState({ decryptmsg: "" });
    this.decrypt(this.state.encrypteddc, this.state.encryptediv);
  };

  handleSend = e => {
    var key = localStorage.getItem("secret");
    var buffer = Buffer.alloc(16);
    buffer.fill(key);
    this.encrypt(this.state.text, buffer);
  };

  render() {
    const { username, n, e } = this.state;
    return (
      <React.Fragment>
        <Menu
          onClick={this.handleClick}
          selectedKeys={[this.state.current]}
          mode="horizontal"
        >
          <Menu.Item key="mail">
            <Icon type="container" />
            Cybersecurity Final Project: Diffie Hellman Message Logger
          </Menu.Item>
        </Menu>
        <div>
          {n !== "" && e !== "" ? (
            <h1 style={{ margin: 20, color: "red" }}>
              The Server Public Key: {e} {n}
            </h1>
          ) : null}

          <h1 style={{ margin: 20 }}>Encrypt and Send</h1>
          <TextArea
            onChange={this.handleChange}
            style={{ marginTop: "2vh", width: "90vw", marginLeft: "2vw" }}
            rows={4}
            placeholder={"Enter a message"}
          />
          <div>
            <Button
              type="primary"
              onClick={this.handleSend}
              htmlType="submit"
              className="login-form-button"
              style={{ marginTop: "2vh", marginLeft: "2vw" }}
            >
              Submit
            </Button>
          </div>
          {this.state.encryptedtx !== "" ? (
            <div style={{ width: "40vw" }}>
              <h3 style={{ margin: 20, width: "70%", wordWrap: "break-word" }}>
                {"Encryped text: " + this.state.encryptedtx}{" "}
              </h3>
              <h3 style={{ margin: 20, width: "70%", wordWrap: "break-word" }}>
                {"Initialization vector: " + this.state.ivtx}{" "}
              </h3>
            </div>
          ) : (
            <> </>
          )}
        </div>
        <div>
          <h1 style={{ margin: 20 }}>Decrypt</h1>
          <TextArea
            onChange={this.handleChangeDC}
            style={{ marginTop: "2vh", width: "90vw", marginLeft: "2vw" }}
            rows={4}
            placeholder={"Encrypted Text"}
          />
          <TextArea
            onChange={this.handleChangeIV}
            style={{ marginTop: "2vh", width: "90vw", marginLeft: "2vw" }}
            rows={4}
            placeholder={"Intialization Vector"}
          />
        </div>

        <Button
          type="primary"
          onClick={this.handleDecrypt}
          htmlType="submit"
          className="login-form-button"
          style={{ marginTop: "2vh", marginLeft: "2vw" }}
        >
          Decrypt
        </Button>
        {this.state.decryptmsg !== "" ? (
          <div style={{ width: "40vw" }}>
            <h3 style={{ margin: 20, width: "70%", wordWrap: "break-word" }}>
              {"Decrypted Message: " + this.state.decryptmsg}{" "}
            </h3>
          </div>
        ) : (
          <> </>
        )}
      </React.Fragment>
    );
  }
}

export default App;
