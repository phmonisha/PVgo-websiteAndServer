import { getToken } from "./otherFunc.js";

let selectedDevice = null;


document.addEventListener('DOMContentLoaded', function () {

    document.getElementById("close-popup").addEventListener("click", function () {
        document.getElementById("popup").style.display = "none";
    });

});


document.getElementById("open-popup").addEventListener("click", async function () {

    const saveState = document.getElementById("saveStatus");
    const token = getToken();
    const pageIdentifier = 'customerDashboard';
    const data = { pageIdentifier };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetch("/populateDeviceList", options);

        if (response.ok) {
            const json = await response.json();

            console.log('json: ', json.data);

            let selectElement = document.getElementById("units");

            // Clear existing options
            selectElement.innerHTML = "";

            // Iterate over the data array and add options
            json.data.forEach(item => {
                let option = document.createElement("option");
                option.value = item.label;
                option.textContent = item.label;
                option.setAttribute("data-deviceId", item.deviceId); // Set deviceId as a custom attribute
                selectElement.appendChild(option);
            });

            // Add change event listener to select element
            selectElement.addEventListener("change", handleDeviceSelection);

            // Call the event listener function explicitly for the first device
            if (selectElement.options.length > 0) {
                const firstDeviceEvent = new Event("change");
                selectElement.dispatchEvent(firstDeviceEvent);
            }

            // Function to handle device selection
            async function handleDeviceSelection(event) {
                // Get the selected device name
                saveState.textContent = '';
                const selectedOption = event.target.selectedOptions[0];
                const selectedDeviceName = selectedOption.value;
                const selectedDeviceId = selectedOption.getAttribute("data-deviceId"); // Get deviceId from custom attribute
                console.log("Selected device name:", selectedDeviceName);
                console.log("Selected device id:", selectedDeviceId);

                console.log('Inside populate alarm settings: ', selectedDeviceId);

                const dataId = { selectedDeviceId };
                const option = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(dataId),
                };

                const resp = await fetch("/populateAlarmSettings", option);

                if (resp.ok) {
                    const settingsData = await resp.json();
                    console.log('settingsData: ', settingsData);


                    const dataFromServer = settingsData;

                    const gridContainer = document.getElementById('gridContainer');
                    gridContainer.innerHTML = '';

                    dataFromServer.forEach(function (data, index) {
                        const switchId = `switch${index + 1}`;
                        const switchStatus = data.status ? 'On' : 'Off';

                        const gridItem = document.createElement('div');
                        gridItem.classList.add('grid-item', 'left-allign', 'text-color');
                        gridItem.textContent = data.name;
                        gridContainer.appendChild(gridItem);

                        const gridItem2 = document.createElement('div');
                        gridItem2.classList.add('grid-item', 'right-allign', 'text-color');

                        const containerDiv = document.createElement('div');
                        containerDiv.classList.add('container');

                        const label = document.createElement('label');
                        label.classList.add('switch');
                        label.setAttribute('for', switchId);

                        const input = document.createElement('input');
                        input.setAttribute('type', 'checkbox');
                        input.setAttribute('id', switchId);
                        input.classList.add('switch-input');
                        if (data.status) input.setAttribute('checked', 'checked');

                        const span1 = document.createElement('span');
                        span1.classList.add('switch-label');
                        span1.setAttribute('data-on', 'On');
                        span1.setAttribute('data-off', 'Off');

                        const span2 = document.createElement('span');
                        span2.classList.add('switch-handle');

                        label.appendChild(input);
                        label.appendChild(span1);
                        label.appendChild(span2);
                        containerDiv.appendChild(label);
                        gridItem2.appendChild(containerDiv);
                        gridContainer.appendChild(gridItem2);

                        // Add hidden input for each switch
                        const hiddenInput = document.createElement('input');
                        hiddenInput.setAttribute('type', 'hidden');
                        hiddenInput.setAttribute('id', `switch${index + 1}State`);
                        hiddenInput.setAttribute('name', `switch${index + 1}`);
                        hiddenInput.setAttribute('value', switchStatus);
                        document.getElementById('popup-form').appendChild(hiddenInput);
                    });

                    document.getElementById("popup").style.display = "block";

                    // Update hidden input value when switch changes
                    const switchInputs = document.querySelectorAll('.switch-input');
                    switchInputs.forEach(function (input) {
                        input.addEventListener('change', function () {
                            const switchNumber = this.getAttribute('id').replace('switch', '');
                            document.getElementById('switch' + switchNumber + 'State').value = this.checked ? "On" : "Off";
                        });
                    });

                    // Submit form
                    document.getElementById('popup-form').addEventListener('submit', async function (event) {
                        event.preventDefault();
                        const formData = new FormData(this);
                        const alarmSettings = [];

                        for (const pair of formData.entries()) {
                            const code = parseInt(pair[0].replace('switch', ''), 10);
                            const status = pair[1] === 'On';
                            alarmSettings.push({ code, status });
                        }

                        console.log(alarmSettings);

                        const data1 = {selectedDeviceId, alarmSettings};

                        const token1 = getToken();

                        const options = {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                'Authorization': `Bearer ${token1}`,
                            },
                            body: JSON.stringify(data1),
                        };

                        //console.log(options);

                        const response1 = await fetch("/setAlarmSetting", options);
                        if (response1.ok) {
                            const status = await response1.json();
                            console.log({ status });
                            saveState.textContent = `Alarm settings for ${selectedDeviceName} saved successfully`;

                        } else {
                            saveState.textContent = `Error while saving alarm settings for ${selectedDeviceName}`;
                        }
                    });

                }
                else if (!resp.ok) {
                    throw new Error(`Server responded with status ${resp.status}`);
                }
            }
        }


        else if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }


    } catch (error) {
        console.error("Error during fetch operation:", error.message);
    }


});