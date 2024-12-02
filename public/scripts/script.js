const circleType = new CircleType(document.getElementById('welcome_msg'));
circleType.radius(200).dir(1);

//Initialize bootstrap alert system
const alertPlaceholder = document.getElementById('liveAlert');
const appendAlert = (message, type) => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')

    alertPlaceholder.append(wrapper)
}

//Helpers
async function getParentsPage() {
    const response = await fetch("/parents", {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if(response.ok){
        location.href = response.url;
    }
}

async function getPresents() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const date = urlParams.get('birthDate');
    const response = await fetch(`/api/gregory/${date}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    if (response.ok === true) {
        const presents = await response.json();
        const container = document.querySelector("#presents");
        createTable(presents,container);
    }
}

async function reserveItem(itemId, giver) {
    const response = await fetch("api/reserve", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            present_id: itemId,
            giver: giver
        })
    });
    if (response.ok === true) {
        var myModalEl = document.getElementById('reserveModal');
        var modal = bootstrap.Modal.getInstance(myModalEl);
        modal.hide();

        $("#successModal .modal-body").text(`Успешно забронировано за "${giver}" !`);
        $('#successModal').modal('show');
    }
    else {
        const error = await response.json();
        console.log(error);
        appendAlert(error.message, 'danger');
    }
}

//Create list of wishes
function createTable(presents,container) {

    for(let i = 0; i < presents.length; i++){
        if(!presents[i].is_reserved){
            let card = document.createElement("div");
            card.setAttribute("class", "card mb-3");

            let row = document.createElement("div");
            row.setAttribute("class","row g-0");

            card.appendChild(row);

            let col = document.createElement("div");
            col.setAttribute("class", "col-md-4");

            row.appendChild(col);

            let img = document.createElement("img");
            img.setAttribute("src", presents[i].present_link_photo);
            img.setAttribute("class", "card-img-top");

            col.appendChild(img);

            let col2 = document.createElement("div");
            col2.setAttribute("class","col-md-8");
            
            row.appendChild(col2);

            let body2 = document.createElement("div");
            body2.setAttribute("class","card-body");
            col2.appendChild(body2);

            let h5 = document.createElement("h5");
            h5.setAttribute("class", "card-title");

            let link = document.createElement("a");
            link.setAttribute("href", presents[i].present_link);
            link.setAttribute("target", "_blank");

            h5.appendChild(link);

            let content = document.createTextNode(presents[i].present_name);
            link.appendChild(content);

            body2.appendChild(h5);

            let footer = document.createElement("div");
            footer.setAttribute("class","card-footer");

            card.appendChild(footer);

            let a = document.createElement("button");
            a.setAttribute("class", presents[i].is_reserved ? "btn btn-primary myButton disabled" : "btn btn-primary myButton");
            a.setAttribute("type", "button");
            a.setAttribute("data-bs-toggle", "modal");
            a.setAttribute("data-bs-target", "#reserveModal");
            a.setAttribute("data-bs-whatever", presents[i].id);
            let buttonText = document.createTextNode(presents[i].is_reserved ? "Забронированно" : "Забронировать");
            a.appendChild(buttonText);

            footer.appendChild(a);

            container.appendChild(card); 
        }
    }
}

//Button for parents login
document.getElementById("reserve").addEventListener("click", async () => {
    giverName = document.getElementById("giverName");
    itemId = document.getElementById("itemId");

    if(giverName.value == ''){
        giverName.className += " is-invalid";
    } else if(itemId.value == ''){
        return;
    } else {
        await reserveItem(itemId.value, giverName.value);
    }

    //Reset fields values
    giverName.value = "";
    itemId.value = "";
});

//Remove class from html element
function RemoveClass(elem, newClass) {
    elem.classList.remove(newClass);
};

const myModal = document.getElementById('reserveModal') 
myModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const recipient = button.getAttribute('data-bs-whatever');
    const modalBodyInput = myModal.querySelector('.modal-body #itemId');
    modalBodyInput.value = recipient;
})

function refresh(){
    location.reload();
}

getPresents();