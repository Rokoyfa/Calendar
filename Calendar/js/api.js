
export class API {

    /**
     * 
     * @returns
     */
    static isLoggedin() {
        return this.getCookie("token") != undefined
    }

    /**
     * 
     * @param {Function} dispatcher 
     * @param {String} path 
     * @param {JSON} data 
     */
    static request(dispatcher, path, data) {
        fetch('http://localhost:5000/v1/api/calendar/' + path, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(function (response) {
            return response.json()
        }).then((data) => dispatcher(data))
            .catch(function (error) {
                console.warn('Something went wrong.', error)
            })
    }

    /**
     * 
     * @param {String} user 
     * @param {String} password 
     */
    static login(user, password) {
        this.request(
            (data) => {
                if (data['code'] === 200) {
                    document.getElementById("LoginButton").style.display = "none"
                    document.getElementById("LogoutButton").style.display = "block"
                    document.getElementById("LoginModal").style.display = "none"
                    $("#calendar").removeClass("opaque")                    

                    this.setCookie("token", data['token'], 365)
                } else
                    document.getElementById("login_err").innerText = data['details']
            },
            "login",
            {
                user: user,
                pass: password
            }
        )
    }

    /**
     * 
     * @param {String} user 
     * @param {String} password 
     * @param {String} password_confirm
     */
    static register(user, password, password_confirm) {
        this.request(
            (data) => {
                if (data['code'] === 200) {
                    document.getElementById("RegistrierModal").style.display = "none";
                    $("#calendar").removeClass("opaque");
                } else
                    document.getElementById("reg_err").innerText = data['details']
            },
            "register",
            {
                user: user,
                pass: password,
                pass_con: password_confirm
            }
        )
    }

    /**
     * 
     */
    static logout() {
        this.request(
            (data) => {
                console.log(data)
                if (data['code'] === 200) {
                    document.getElementById("LoginButton").style.display = "block"
                    document.getElementById("LogoutButton").style.display = "none"
                    document.getElementById("LogoutModal").style.display = "none"
                    $("#calendar").removeClass("opaque")

                    this.eraseCookie("token")
                } else
                    document.getElementById("login_err").innerText = data['details']
            },
            "logout",
            {
                apitoken: this.getCookie("token")
            }
        )
    }

    /**
     * 
     * @param {Function} handler
     * 
     */
    static read(handler) {
        this.request(
            (data) => {
                handler(data)
            },
            "data",
            {
                apitoken: this.getCookie("token"),
                apimode: "read"
            }
        )
    }

    /**
     * 
     * @param {String} id
     * @param {Map} values
     * 
     * Code Template:
     * let args = new Map()
     * args.set('id', 'supercoolid')
     * args.set('color', 'green')
     * 
     */
    static write(handler, id, args) {
        let json = {
            apitoken: this.getCookie("token"),
            apimode: "write",
            id: id
        }
        args.forEach((value, key) => {
            json[key] = value
        })
        this.request(
            (data) => {
                handler(data)
            },
            "data",
            json
        )
    }

    /**
     * 
     * @param {Function} handler
     * @param {String} id
     * 
     */
    static remove(handler, id) {
        this.request(
            (data) => {
                handler(data)
            },
            "data",
            {
                apitoken: this.getCookie("token"),
                apimode: "delete",
                id: id
            }
        )
    }

    // Cookies
    /**
     * 
     * @param {String} name 
     * @param {*} value 
     * @param {int} days 
     */
    static setCookie(name, value, days) {
        document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * days};`
    }


    static converter = {
        read: function (value) {
            if (value[0] === '"') {
                value = value.slice(1, -1);
            }
            return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
        },
        write: function (value) {
            return encodeURIComponent(value).replace(
                /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
                decodeURIComponent
            )
        }
    };

    /**
     * 
     * @param {String} key 
     * @returns 
     */
    static getCookie(key) {
        var cookies = document.cookie ? document.cookie.split('; ') : [];
        var jar = {};
        for (var i = 0; i < cookies.length; i++) {
            var parts = cookies[i].split('=');
            var value = parts.slice(1).join('=');

            try {
                var foundKey = decodeURIComponent(parts[0]);
                jar[foundKey] = this.converter.read(value, foundKey);

                if (key === foundKey) {
                    break
                }
            } catch (e) { }
        }

        return key ? jar[key] : jar
    }

    /**
     * 
     * @param {String} name 
     */
    static eraseCookie(name) {
        this.setCookie(name, "", -1)
    }

}