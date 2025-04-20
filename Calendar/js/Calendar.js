import { dateString, getDayIndex, addDays } from "./helper.js";
import { Event, MODE } from "./event.js";
import { API } from "./api.js";

export class Calendar {

    constructor() {
        this.mode = MODE.VIEW;
        this.events = {};
        this.weekOffset = 0;
        this.weekStart = null;
        this.weekEnd = null;
        this.slotHeight = 30;
        this.readytotrash = false;
    }

    setup() {
        this.setupTimes();
        this.setupDays();
        this.calculateCurrentWeek();
        this.showWeek();
        this.setupControls();
        this.loadEvents();

        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                this.changeWeek(1)
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                this.changeWeek(-1)
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeModal()
            }
        });

        /* API Start */
        if (API.isLoggedin()) {
            document.getElementById("LogoutButton").style.display = "block"
            document.getElementById('teamButton').style.display = "block";
        } 
        else {
            document.getElementById("LoginButton").style.display = "block"
        } 
        /* API End */
    }

    setupControls() {
        $("#nextWeekBtn").click(() => this.changeWeek(1));
        $("#prevWeekBtn").click(() => this.changeWeek(-1));
        $("#addButton").click(() => this.addNewEvent());
        $("#cancelButton").click(() => this.closeModal());
        $(".color").click(this.changeColor);
        $("#LoginButton").click(() => this.LoginModal());
        $("#LogoutButton").click(() => this.LogoutModal());
        $("#Anmeldebtn").click(() => this.LoginModal());
        $("#trashButton").click(() => this.TrashModal());
        $("#YesButton").click(() => this.Trash());
        $("#addButton").click(() => this.addNewEvent());
        $("#submit").click(() => this.Login());
        $("#Registrierenbtn").click(() => this.RegistrierModal());
        $("#Loginbtn").click(() => this.login());
        $("#Logoutbtn").click(() => this.logout());
        $("#teamButton").click(() => this.teammodal())
    }

    setupTimes() {
        const header = $("<div></div>").addClass("columnHeader");
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            $("<div></div>")
                .attr("data-hour", hour)
                .addClass("time")
                .text(`${hour}:00 - ${hour + 1}:00`)
                .appendTo(slots);
        }
        $(".dayTime").append(header).append(slots);
    }

    setupDays() {
        const cal = this;
        $(".day").each(function () {
            const dayIndex = parseInt($(this).attr("data-dayIndex"));
            const name = $(this).attr("data-name");
            const header = $("<div></div>").addClass("columnHeader").text(name);
            const slots = $("<div></div>").addClass("slots");
            $("<div></div>").addClass("dayDisplay").appendTo(header);
            for (let hour = 0; hour < 24; hour++) {
                $("<div></div>")
                    .attr("data-hour", hour)
                    .appendTo(slots)
                    .addClass("slot")
                    .click(() => cal.clickSlot(hour, dayIndex))
                    .hover(
                        () => cal.hoverOver(hour),
                        () => cal.hoverOut()
                    );
            }
            $(this).append(header).append(slots);
        });
    }

    calculateCurrentWeek() {
        const now = new Date();
        this.weekStart = addDays(now, -getDayIndex(now));
        this.weekEnd = addDays(this.weekStart, 6);
    }

    changeWeek(number) {
        this.weekOffset += number;
        this.weekStart = addDays(this.weekStart, 7 * number);
        this.weekEnd = addDays(this.weekEnd, 7 * number);
        this.showWeek();
        this.loadEvents();
    }

    showWeek() {
        const options = {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        };
        $("#weekStartDisplay").text(
            this.weekStart.toLocaleDateString(undefined, options)
        );
        $("#weekEndDisplay").text(this.weekEnd.toLocaleDateString(undefined, options));

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = addDays(this.weekStart, dayIndex);
            const display = date.toLocaleDateString(undefined, {
                month: "2-digit",
                day: "2-digit",
            });
            $(`.day[data-dayIndex=${dayIndex}] .dayDisplay`).text(display);
        }
        if (this.weekOffset == 0) {
            this.showCurrentDay();
        } else {
            this.hideCurrentDay();
        }
    }

    showCurrentDay() {
        const now = new Date();
        const dayIndex = getDayIndex(now);
        $(`.day[data-dayIndex=${dayIndex}]`).addClass("currentDay");
    }

    hideCurrentDay() {
        $(".day").removeClass("currentDay");
    }

    hoverOver(hour) {
        $(`.time[data-hour=${hour}]`).addClass("currentTime");
    }

    hoverOut() {
        $(".time").removeClass("currentTime");
    }

    clickSlot(hour, dayIndex) {
        this.closeModal();
        if (this.mode != MODE.VIEW) return;
        this.mode = MODE.CREATE;
        const start = hour.toString().padStart(2, "0") + ":00";
        const end =
            hour < 23
                ? (hour + 1).toString().padStart(2, "0") + ":00"
                : hour.toString().padStart(2, "0") + ":59";

        const date = dateString(addDays(this.weekStart, dayIndex));
        const event = new Event({
            start,
            end,
            date,
            title: "",
            description: "",
            color: "red",
        });
        this.openModal(event);
    }

    changeColor() {
        $(".color").removeClass("active");
        $(this).addClass("active");
    }

    openModal(event) {
        $("#modalTitle").text(
            this.mode == MODE.UPDATE ? "Bearbeite dein Termin" : "Erstelle ein Termin"
        );
        $("#eventTitle").val(event.title);
        $("#eventDate").val(event.date);
        $("#eventStart").val(event.start);
        $("#eventEnd").val(event.end);
        $("#eventDescription").val(event.description);
        $(".color").removeClass("active");
        $(`.color[data-color=${event.color}]`).addClass("active");
        if (this.mode == MODE.UPDATE) {
            $("#submitButton").val("Update");
            $("#deleteButton")
                .show()
                .off("click")
                .click(() => event.deleteIn(this));
            $("#copyButton")
                .show()
                .off("click")
                .click(() => event.copyIn(this));
        } else if (this.mode == MODE.CREATE) {
            $("#submitButton").val("Create");
            $("#deleteButton, #copyButton").hide();
        }
        $("#eventModal").fadeIn(200);
        $("#eventTitle").focus();
        $("#calendar").addClass("opaque");
        $("#eventModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
                this.submitModal(event);
            });
    }

    submitModal(event) {
        if (event.isValidIn(this)) {
            event.updateIn(this);
            this.closeModal();
        }
    }

    closeModal() {
        $("#LogoutModal").fadeOut(200);
        $("#TrashModal").fadeOut(200);
        $("#LoginModal").fadeOut(200);
        $("#RegistrierModal").fadeOut(200);
        $("#eventModal").fadeOut(200);
        $(".teammodal").fadeOut(200);
        $("#errors").text("");
        $("#LogoutModal").removeClass("opaque");
        $("#calendar").removeClass("opaque");
        $("#TrashModal").removeClass("opaque");
        $("#LoginModal").removeClass("opaque");
        $("#RegistrierModal").removeClass("opaque");
        $(".teammodal").removeClass('opaque');
        this.mode = MODE.VIEW;
    }

    loadEvents() {
        /* API Start */
        this.events = {}

        document.querySelectorAll(".event").forEach(function (element) {
            element.remove()
        })

        let calendar = this
        if (API.isLoggedin())
            API.read(function (data) {
                console.log("Datensätze", data.length)
                for (var i = 0; i < data.length; i++) {
                    var event = new Event({
                        id: data[i]['id'],
                        title: data[i]['title'],
                        start: data[i]['start'],
                        end: data[i]['end'],
                        prevDate: data[i]['prevDate'],
                        date: data[i]['date'],
                        description: data[i]['description'],
                        color: data[i]['color']
                    })
                    event.showIn(calendar)
                    event.saveIn(calendar)
                }
            })
        /* API End */

    }

    TrashModal() {
        if (this.mode != MODE.VIEW) return;
        this.closeModal();
        $("#TrashModal").fadeIn(200);
        var modal = document.getElementById("TrashModal");
        var btn = document.getElementById("trashButton");
        var YesBtn = document.getElementById("YesButton");
        var NoBtn = document.getElementById("NoButton");
        btn.onclick = function () {
            modal.style.display = "block";
        }
        NoBtn.onclick = function () {
            modal.style.display = "none";
            $("#calendar").removeClass("opaque");
        }
        YesBtn.onclick = function () {
            //* API Start *//
            API.read(data => {
                for (var i = 0; i < data.length; i++) {
                    API.remove((ret) => {
                        console.log(ret);
                    }, data[i]['id'])
                }
            })
            //* API End *//
            modal.style.display = "none"
            $("#calendar").removeClass("opaque");
        }
        $("#calendar").addClass("opaque");
    }

    Trash() {
        if (this.mode != MODE.VIEW) return;
        this.readytotrash
        this.readytotrash = true;
        this.events = {};
        $(".event").remove();
        //* API Start *//
        API.remove((data) => {
            console.log(data)
        }, this.id)
        //* API End *//
        this.freshpage();
    }

    addNewEvent() {
        this.closeModal();
        if (this.mode != MODE.VIEW) return;
        this.mode = MODE.CREATE;
        const event = new Event({
            start: "00:00",
            end: "23:59",
            date: dateString(this.weekStart),
            title: "",
            description: "",
            color: "red"
        });
        this.openModal(event);
        this.mode = MODE.VIEW;
    }

    LoginModal() {
        if (API.isLoggedin())
            return

        this.closeModal();
        $("#LoginModal").fadeIn(200);

        document.getElementById("login_err").innerText = ""

        var Lmodal = document.getElementById("LoginModal");
        var lbtn = document.getElementById("LoginButton");
        var span = document.getElementsByClassName("close")[0];

        lbtn.onclick = function () {
            Lmodal.style.display = "block";
        }

        span.onclick = function () {
            Lmodal.style.display = "none";
            $("#calendar").removeClass("opaque");
        }

        $("#LoginModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
            });
        $("#calendar").addClass("opaque");
        this.mode = MODE.VIEW;
    }

    RegistrierModal() {
        this.closeModal();
        this.mode = MODE.CREATE;

        document.getElementById("reg_err").innerText = "";

        var modal = document.getElementById("RegistrierModal");
        var span = document.getElementsByClassName("Rclose")[0];
        var Rbtn = document.getElementById("Registrierenbtn");
        var submitbtn = document.getElementById("Registerbtn");

        span.onclick = function () {
            modal.style.display = "none";
            $("#calendar").removeClass("opaque");
        }

        Rbtn.onclick = function () {
            modal.style.display = "block"
        }
        this.mode = MODE.VIEW;

        submitbtn.onclick = function () {
            /* API Start */
            let uname = document.getElementById("r_username");
            let pass = document.getElementById("r_pass");
            let pass_con = document.getElementById("r_pass_con")

            API.register(uname.value, pass.value, pass_con.value)
            /* API End */
        }
        $("#RegistrierModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
            });
        $("#calendar").addClass("opaque");
    }

    LogoutModal() {
        this.closeModal();
        $("#LogoutModal").fadeIn(200);
        var Lomodal = document.getElementById("LogoutModal");
        var lbtn = document.getElementById("LoginButton");
        var span = document.getElementsByClassName("Loclose")[0];

        lbtn.onclick = function () {
            Lomodal.style.display = "block";
        }

        span.onclick = function () {
            Lomodal.style.display = "none";
            $("#calendar").removeClass("opaque");
        }
        $("#LogoutModal")
            .off("submit")
            .submit((e) => {
                e.preventDefault();
            });
        $("#calendar").addClass("opaque");
        this.mode = MODE.VIEW;
    }

    freshpage() {
        let refresh = false;
        if(!refresh) {
            setTimeout(function() {
                location.reload();
                refresh = true;
            }, 500)
        }
    }

    login() {
        /* API Start */
        let uname = document.getElementById("l_username")
        let pass = document.getElementById("l_pass")
        API.login(uname.value, pass.value)
        this.loadEvents()
        this.freshpage()
        /* API End */
    }

    logout() {
        /* API Start */
        API.logout()
        console.log(this)
        this.loadEvents()
        this.freshpage();
        /* API End */
    }

    teammodal() {
        $('#TeamModal').fadeIn(200);
        let modal = document.querySelector('#TeamModal')
        let openmodal = document.querySelector('#teamButton')
        let span = document.querySelector('.tclose');

        openmodal.onclick = function() {
            modal.style.display = 'block'
        }

        span.onclick = function() {
            console.log('test')
            modal.style.display = "none";
            $("#calendar").removeClass("opaque");
        }

        $('#Calendar').addClass('opaque');
    }
}
