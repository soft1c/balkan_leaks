document.addEventListener('DOMContentLoaded', function() {
  fetchCurrentLayoutStatus();
  setInitialLayoutStatus();
  fetchSponsors();
  fetch('/footer')
    .then(response => response.json())
    .then(footerData => {
      footerData.forEach(footer => {
        const form = document.getElementById(`editFooterForm${footer.id}`);
        if (form) {
          let currentImage = form.querySelector('.current-footer-image');
          // If the image element doesn't exist, create it
          if (!currentImage) {
            currentImage = document.createElement('img');
            currentImage.className = 'current-footer-image';
            form.insertBefore(currentImage, form.firstChild); // Insert it at the top of the form
          }
          currentImage.src = footer.urlPath; // Adjust if necessary to match the correct path
          currentImage.alt = 'Current footer image';
          currentImage.style.display = 'block'; // Make sure the image is displayed

          // Set the text value
          const textInput = form.querySelector('textarea[name="footerText"]');
          if (textInput) {
            textInput.value = footer.tekst;
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching footer data:', error);
    });
    let searchTimeoutToken;
  
  const searchInput = document.getElementById('searchInputEdit');
  const dropdown = document.getElementById('searchDropdown');
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value;
    console.log(searchTerm); // Ovo bi trebalo raditi sada
    
    clearTimeout(searchTimeoutToken);
  
    if (searchTerm.length > 2) {
      searchTimeoutToken = setTimeout(() => {
        dropdown.style.display = 'none'; // Sakrij dropdown dok se čeka odgovor
        fetch(`/search?q=${encodeURIComponent(searchTerm)}`)
          .then(response => response.json())
          .then(persons => {
            dropdown.innerHTML = ''; // Očisti prethodne rezultate
            if (persons.length > 0) {
              persons.forEach(person => {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.textContent = `${person.ime} ${person.prezime}`;
                option.onclick = function() {
                  populateEditForm(person.id);
                  dropdown.style.display = 'none'; // Sakrij dropdown
                };
                dropdown.appendChild(option);
              });
              dropdown.style.display = 'block'; // Prikaz dropdown-a s rezultatima
            } else {
              dropdown.style.display = 'none';
            }
          })
          .catch(error => {
            console.error('Search error:', error);
            dropdown.style.display = 'none';
          });
      }, 300);
    } else {
      dropdown.style.display = 'none';
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  fetchEntryStats();
  fetchAdmins();
  fetch('/get-role')
    .then(response => response.json())
    .then(data => {
      var manageModsTab = document.getElementById('ManageModerators1');
      var ManageAdminsTab=document.getElementById('ManageAdmins1');
      if(data.role==='owner'){
        manageModsTab.style.display = 'block';
        ManageAdminsTab.style.display = 'block';
      }
      else if (data.role === 'admin') {
        console.log('admin');
        manageModsTab.style.display = 'block';
        ManageAdminsTab.style.display = 'none';
      } else {
        manageModsTab.style.display = 'none';
        ManageAdminsTab.style.display = 'none';
      }
    })
    .catch(error => console.error('Error fetching role:', error));

    fetchModerators();
});
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('AddPersonForm'); // Pretpostavimo da je ovo ID vaše forme
  form.onsubmit = function() {
    console.log(opis);
    var opis = quill.root.innerHTML; // Uzima HTML sadržaj Quill editora
    document.getElementById('hiddenOpis1').value = opis; // Postavlja sadržaj u skriveni textarea
  };
}); 

function fetchModerators() {
  fetch('/moderatori')
    .then(response => response.json())
    .then(moderators => {
      const modSelect = document.getElementById('moderatorSelect');
      moderators.forEach(mod => {
        console.log(mod);
        const option = document.createElement('option');
        option.value = mod.id; // Pretpostavljamo da svaki moderator ima ID
        option.textContent = mod.username; // Pretpostavljamo da svaki moderator ima username
        modSelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching moderators:', error));
}

function odaberiIstaknuteOsobe() {
  const featuredIds = [
    document.getElementById('featuredPerson1').value,
    document.getElementById('featuredPerson2').value,
    document.getElementById('featuredPerson3').value,
    document.getElementById('featuredPerson4').value
  ];

  fetch('/odaberi-istaknute-osobe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ featuredIds: featuredIds })
  })
  .then(response => response.json())
  .then(data => {
    location.reload();
  })
  .catch(error => {
    console.error('Došlo je do greške:', error);
  });
}
function fetchUserIPs() {
  fetch('/user_ips')
    .then(response => response.json())
    .then(data => {
      const ipList = document.getElementById('ipList');
      ipList.innerHTML = ''; 

      data.forEach(entry => {
        // Check if the operating system is defined and not 'Unknown'
        const osInfo = entry.operatingSystem && entry.operatingSystem !== 'Unknown' 
                       ? `, Operating System: ${entry.operatingSystem}` 
                       : '';

        const listItem = document.createElement('li');
        listItem.textContent = `IP Address: ${entry.ip}, Login Time: ${entry.loginTime}${osInfo}`;
        ipList.appendChild(listItem);
      });
    })
    .catch(error => console.error(error));
}

// Fetch IP addresses on page load
fetchUserIPs();
  
function uploadMedia() {
  const typeSelect = document.getElementById('typeOfFile');
  const selectedType = typeSelect.value;
  const licnostSelect = document.getElementById('licnost');
  const selectedLicnost = licnostSelect.value;
  const uploadUrl = `/upload/${selectedType}`;

  const formData = new FormData(document.getElementById('uploadForm'));
  formData.append('licnost', selectedLicnost);
  formData.append('tipFajla', selectedType);

  fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    location.reload();
  })
  .catch(error => {
    console.error('Došlo je do greške:', error);
  });
}

    function dodajFajlUBazu(licnost, tipFajla, filePath) {
      console.log("Pokusava nesto");
      const uploadUrl = '/dodaj-fajl';
      const formData = new FormData();
      formData.append('licnost', licnost);
      formData.append('tipFajla', tipFajla);
      formData.append('file', filePath);
      console.log(formData);
      fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        
      })
      .catch(error => {
        console.error(error);
      });
    }

    fetch('/ljudi')
      .then(response => response.json())
      .then(data => {
        const licnostSelect = document.getElementById('licnost');
        const licnostMjesecaSelect = document.getElementById('osobaMjeseca');
        const licnost1=document.getElementById('featuredPerson1');
        const licnost2=document.getElementById('featuredPerson2'); 
        const licnost3=document.getElementById('featuredPerson3');
        const licnost4=document.getElementById('featuredPerson4');
        const uredi=document.getElementById('personSelect');
        data.forEach(licnost => {
          const option = document.createElement('option');
          const option1 = document.createElement('option');
          const option2=document.createElement('option');
          const option3=document.createElement('option');
          const option4=document.createElement('option');
          const option5=document.createElement('option');
          const option6=document.createElement('option');
          option2.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option2.text = `${licnost.ime} ${licnost.prezime}`;
          option3.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option3.text = `${licnost.ime} ${licnost.prezime}`;
          option4.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option4.text = `${licnost.ime} ${licnost.prezime}`;

          option5.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option5.text = `${licnost.ime} ${licnost.prezime}`;

          option.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option.text = `${licnost.ime} ${licnost.prezime}`;
          option1.value = licnost.id; // Postavite vrednost opcije na ID ličnosti
          option1.text = `${licnost.ime} ${licnost.prezime}`;
          option6.text=`${licnost.ime} ${licnost.prezime}`;
          option6.value=licnost.id;

          licnostSelect.add(option);
          licnostMjesecaSelect.add(option1);
          licnost1.add(option2);
          licnost2.add(option3);
          licnost3.add(option4);
          licnost4.add(option5);
          uredi.add(option6);
        });
      })
      .catch(error => console.error(error));
  
    function odaberiOsobuMjeseca() {
      const osobaMjesecaSelect = document.getElementById('osobaMjeseca');
      const odabranaOsoba = osobaMjesecaSelect.value;
        console.log(odabranaOsoba + " je odabrana osoba");
      fetch('/odaberi-osobu-mjeseca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ osobaId: odabranaOsoba })
      })
      .then(response => response.json())
      .then(data => {
        location.reload();
      })
      .catch(error => {
        console.error('Došlo je do greške:', error);
      });
    }

    document.addEventListener('DOMContentLoaded', function() {
  fetch('/ljudi')
    .then(response => response.json())
    .then(data => {
      const personsList = document.getElementById('persons-list');
      data.forEach(person => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="person-checkbox" value="${person.id}"></td>
          <td>${person.ime} ${person.prezime}</td>
          <!-- other data columns -->
        `;
        personsList.appendChild(row);
      });
    })
    .catch(error => console.error('Error:', error));
});

function openTab(evt, tabName) {
  console.log(tabName);
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
    console.log(tabcontent[i]);
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  var selectedTab = document.getElementById(tabName);
  if (selectedTab.style.display != "block") {
    console.log(selectedTab);
    selectedTab.style.display = "block";
  }
  evt.currentTarget.className += " active";
}



function previewImage(event) {
  const reader = new FileReader();
  reader.onload = function() {
    const output = document.getElementById('slikaId');
    output.src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

function updateFilename() {
  var fileInput = document.getElementById('file');
  var fileName = fileInput.files[0].name;
  document.getElementById('file-name').textContent = fileName; // Update the placeholder with the file name
}


document.getElementById('search-bar').addEventListener('input', handleSearch);
 
function handleSearch() {
  console.log("pokusavam nesto");
  const searchTerm = document.getElementById('search-bar').value;

  clearTimeout(searchTimeoutToken); // Clear existing timeout

  if (searchTerm.length > 2) {
    // Set a new timeout
    searchTimeoutToken = setTimeout(() => {
      fetch(`/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(results => {
          console.log(result);
          displaySearchResults(results);
        })
        .catch(error => console.error('Search error:', error));
    }, 300); // Adjust 300ms to your liking
  } else {
    clearSearchResults();
  }
}
function displaySearchResults(results) {
const resultsContainer = document.getElementById('searchResults');
resultsContainer.innerHTML = ''; // Clear existing results

if (results.length === 0) {
  // No results found
  resultsContainer.innerHTML = '<div class="search-result-item">Nema ponuđenih osoba</div>';
} else {
  // Display results
  results.forEach(person => {
    const personElement = document.createElement('div');
    personElement.className = 'search-result-item';
    personElement.innerHTML = `<a href="/podstranica/${person.id}">${person.ime} ${person.prezime} - ${person.mjestoRodjenja}</a>`;
    resultsContainer.appendChild(personElement);
  });
}
}

// Function to clear search results
function clearSearchResults() {
  document.getElementById('searchResults').innerHTML = '';
}
function populateEditForm(personId) {
  if (personId) {
    fetch(`/osoba/${personId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log(data);
        document.getElementById('editPersonForm').style.display = 'block';
        
        // Populate the form fields with the data
        document.getElementById('imeEdit').value = data.ime;
        document.getElementById('prezimeEdit').value = data.prezime;
        
        document.getElementById('licnost').value = personId;

        if (data.slikaUrl) {
          let path = 'uploads/media/images/' + data.slikaUrl;
          const imagePreview = document.getElementById('slikaId');
          imagePreview.src = path;
          imagePreview.style.display = 'block';
        }

        // Destroy existing CKEditor instance if it exists
        if (!window.quillInstance) {
          // If not, create a new instance
          window.quillInstance = new Quill('#opisEdit', {
            modules: {
              toolbar: toolbarOptions
            },
            theme: 'snow'
          });
        }
        window.quillInstance.root.innerHTML = data.opis;
      })
      .catch(error => {
        console.error('Failed to fetch person details:', error);
        document.getElementById('editPersonForm').style.display = 'none';
      });
      
  } else {
    document.getElementById('editPersonForm').style.display = 'none';
  }
}



function submitEditForm() {
  const personId = document.getElementById('personSelect').value;
  if (!personId) {
    alert('No person selected.');
    return;
  }
  console.log(personId);
  if (window.quillInstance) {
    const opisEditData = window.quillInstance.root.innerHTML;
    document.getElementById('hiddenOpis').value = opisEditData; // Update the hidden textarea
  }

  const form = document.getElementById('editPersonForm');
  const formData = new FormData(form);
  console.log(formData);
  console.log(form);

  // Add the selected person ID to the form data
  formData.append('id', personId);

  fetch(`/admin/update/${personId}`, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
    location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to update the person');
  });
}


function addModerator() {
  const username = document.getElementById('modUsername').value;
  const password = document.getElementById('modPassword').value;
  const nickname= document.getElementById('modNickname').value;

  fetch('/admin/addModerator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password,nickname })
  })
  .then(response => response.json())
  .then(data => {
    location.reload();
  })
};

function deleteModerator(){
  const id = document.getElementById('moderatorSelect').value;
  fetch('/admin/deleteModerator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id })
  })
  .then(response => response.json())
  .then(data => {
    location.reload();
  })
};

document.addEventListener('DOMContentLoaded', (event) => {
  const logoutButton = document.getElementById('odjava');
  console.log(logoutButton); // Provjerite da li postoji button u DOM-u

  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      console.log('Logout clicked'); // Ova linija bi trebala biti ispisana u konzolu kada kliknete dugme
      fetch('/logout', {
        method: 'POST'
      })
      .then(() => {
        window.location.href = '/login.html';
      })
      .catch(error => {
        console.error('Došlo je do greške prilikom odjave:', error);
      });
    });
  }
});

function logout(){
  console.log('Logout clicked'); // Ova linija bi trebala biti ispisana u konzolu kada kliknete dugme
      fetch('/logout', {
        method: 'POST'
      })
      .then(() => {
        window.location.href = '/login.html';
      })
      .catch(error => {
        console.error('Došlo je do greške prilikom odjave:', error);
      });
    };


    function fetchEntryStats() {
      console.log('Fetching entry stats...');
      fetch('/visit-counts')
          .then(response => response.json())
          .then(data => {
              console.log(data);
              document.getElementById('dailyCount').textContent = "Today's Visits: " + data.today;
              document.getElementById('weeklyCount').textContent = "Last Week's Visits: " + data.last_week;
              document.getElementById('allTimeCount').textContent = "Total Visits: " + data.total;
          })
          .catch(error => console.error('Error fetching entry stats:', error));
  }


  function deletePerson() {
    const personId = document.getElementById('personSelect').value;
    if (!personId) {
      alert('No person selected.');
      return;
    }
    if (confirm('Are you sure you want to delete this person?')) {
      fetch('/obrisi_osobu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: personId })
      })
      .then(response => response.json())
      .then(data => {
        location.reload();
        // Refresh the person list or navigate away
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete the person');
      });
    }
  }
    
  function fetchAdmins() {
    fetch('/admini')
      .then(response => response.json())
      .then(admins => {
        const adminSelect = document.getElementById('adminSelect');
        admins.forEach(admin => {
          console.log(admin);
          const option = document.createElement('option');
          option.value = admin.id; // Pretpostavljamo da svaki moderator ima ID
          option.textContent = admin.username; // Pretpostavljamo da svaki moderator ima username
          adminSelect.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching admins :', error));
  }
  


function addAdmin() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const nickname = document.getElementById('adminNickname').value;
  console.log(username, password);

  fetch('/admin/addAdmin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password,nickname })
  })
  .then(response => response.json())
  .then(data => {
    location.reload();
  })
}

function deleteAdmin(){
  const id = document.getElementById('adminSelect').value;
  fetch('/admin/deleteAdmin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id })
  })
  .then(response => response.json())
  .then(data => {
    location.reload();
  })
}

document.querySelectorAll('.editFooterForm').forEach(form => {
  form.querySelector('input[type="file"]').addEventListener('change', function(e) {
      var imgPreview = form.querySelector('.current-footer-image');
      var file = e.target.files[0];
      var reader = new FileReader();
      
      reader.onload = function(e) {
          imgPreview.src = e.target.result;
      };
      
      reader.readAsDataURL(file);
  });
});



function submitFooterEdit(footerId) {
  // Assuming your form IDs follow the pattern "editFooterForm{footerId}"
  var formElement = document.getElementById(`editFooterForm${footerId}`);
  var formData = new FormData(formElement);

  console.log(formData);
  // Make the API call to the server
  fetch('/update-footer', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    // Handle success
    console.log('Success:', data);
    alert('Footer updated successfully!');
  })
  .catch(error => {
    // Handle errors
    console.error('Error:', error);
    alert('Error updating footer');
  });
}


function changePassword() {
  var currentPassword = document.getElementById('currentPassword').value;
  var newPassword = document.getElementById('newPassword').value;
  var confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmNewPassword) {
    alert('Passwords do not match.');
    return;
  }
  fetch('/change_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: currentPassword,
      newPassword: newPassword
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
  return response.json();
  })
  .then(data => {
    location.reload();
  })
  .catch((error) => {
    console.error(error);
  });

  
}

function submitNews(){
  event.preventDefault();

  var newsTitle = document.getElementById('newsTitle').value;

  var newsContent = quillNews.root.innerHTML;
  console.log(newsContent, newsTitle);
  var formData = new FormData();
  formData.append('title', newsTitle);       // Key: 'title'
  formData.append('content', newsContent);
  console.log(formData);
  fetch('/dodaj_vijest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        naslov: newsTitle,
        tekst: newsContent
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
  })
  .then(data => {
      console.log('Success:', data);
      alert('News article published successfully!');
  })
  .catch((error) => {
      // Handle errors
      console.error('Error:', error);
      alert('Failed to publish news article.');
  });
}
function updatePersonStatus() {
  const selectedPersonId = document.getElementById('personSelect').value;
  if (!selectedPersonId) {
    alert('Please select a person.');
    return;
  }

  const isPersonOfTheMonth = document.getElementById('personOfTheMonthCheckbox').checked;
  const isFeaturedPerson = document.getElementById('featuredPersonCheckbox').checked;

  // Update Person of the Month if checked
  if (isPersonOfTheMonth) {
    fetch('/odaberi-osobu-mjeseca', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ osobaId: selectedPersonId })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
  }

  // Logic to handle Featured Person will go here

  alert('Status updated successfully!');
}

function fetchPersonsAndCreateSelector(boxId, clickedElement) {
  fetch('/ljudi')
    .then(response => response.json())
    .then(persons => {
      createPersonSelector(persons, boxId, clickedElement);
    })
    .catch(error => console.error('Error fetching persons:', error));
}

function createPersonSelector(persons, boxId, clickedElement){
  const selector = document.createElement('div');
  selector.id = 'personSelector';
  selector.style = 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid black; z-index: 1000;';

  persons.forEach(person => {
    const personElement = document.createElement('div');
    personElement.textContent = person.ime + ' ' + person.prezime;
    personElement.onclick = () => selectPerson(person.id, person.ime + ' ' + person.prezime, boxId, clickedElement, selector);
    selector.appendChild(personElement);
  });

  document.body.appendChild(selector);
}

function selectPerson(personId, personName, boxId, clickedElement, selector) {
  if (clickedElement) {
    clickedElement.setAttribute('data-selected-person-id', personId);
    clickedElement.textContent = personName;
  }
  selector.remove();
}

function openPersonSelector(boxId, element) {
  fetchPersonsAndCreateSelector(boxId, element);
}

function fetchCurrentLayoutStatus() {
  fetch('/osobaMjeseca')
    .then(response => response.json())
    .then(data => {
      if (data && data.osobaId) {
        console.log("osoba mjeseca",data);
        updateLayoutBox('personOfTheMonth', data.osobaId);
      }
    })
    .catch(error => console.error('Error fetching Person of the Month:', error));

  fetch('/get_featured_persons')
    .then(response => response.json())
    .then(data => {
      data.forEach((person, index) => {
        if (person.id) {
          updateLayoutBox(`featuredPerson${index + 1}`, person.id);
        }
      });
    })
    .catch(error => console.error('Error fetching Featured Persons:', error));
}

function updateLayoutBox(boxId, personId) {
  fetch(`/osoba/${personId}`)
    .then(response => response.json())
    .then(person => {
      if (person) {
        const boxElement = document.getElementById(boxId);
        if (boxElement) {
          boxElement.textContent = person.ime + ' ' + person.prezime;
        }
      }
    })
    .catch(error => console.error('Error fetching person details:', error));
}

function submitLayoutChanges() {
  // Assuming you have stored the selected IDs in variables or elements
  const personOfTheMonthId = document.getElementById('personOfTheMonth').getAttribute('data-selected-person-id');
  const featuredPersonIds = [];
  
  for (let i = 1; i <= 4; i++) {
    const featuredPersonId = document.getElementById(`featuredPerson${i}`).getAttribute('data-selected-person-id');
    if (featuredPersonId) {
      featuredPersonIds.push(featuredPersonId);
    } else {
      featuredPersonIds.push(null); // Or handle the missing ID case as needed
    }
  }
  console.log('id je ',personOfTheMonthId);
  // Submit Person of the Month
  if (personOfTheMonthId) {
    
    fetch('/odaberi-osobu-mjeseca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osobaId: personOfTheMonthId })
    })
    .then(response => response.json())
    .then(data => console.log('Person of the Month updated:', data))
    .catch(error => console.error('Error updating Person of the Month:', error));
  }

  // Submit Featured Persons
  if (featuredPersonIds.length === 4) {
    fetch('/odaberi-istaknute-osobe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featuredIds: featuredPersonIds })
    })
    .then(response => response.json())
    .then(data => console.log('Featured Persons updated:', data))
    .catch(error => console.error('Error updating Featured Persons:', error));
  }

  alert('Layout changes submitted!');
}

function setInitialLayoutStatus() {
  // Postavljanje Osobe mjeseca
  fetch('/osobaMjeseca')
    .then(response => response.json())
    .then(data => {
      if (data && data.osobaId) {
        updateLayoutBox('personOfTheMonth', data.osobaId);
      }
    })
    .catch(error => console.error('Error fetching Person of the Month:', error));

  // Postavljanje Istaknutih osoba
  fetch('/get_featured_persons')
    .then(response => response.json())
    .then(data => {
      data.forEach((person, index) => {
        const boxElement = document.getElementById(`featuredPerson${index + 1}`);
        if (boxElement && person.id) {
          boxElement.setAttribute('data-selected-person-id', person.id);
          boxElement.textContent = person.ime + ' ' + person.prezime;
        }
      });
    })
    .catch(error => console.error('Error fetching Featured Persons:', error));
}

function addPerson() {
  const formData = new FormData(document.getElementById('AddPersonForm'));

  fetch('/admin/dodaj', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // Obrada nakon uspješnog dodavanja osobe
  })
  .catch(error => {
    console.error('Došlo je do greške:', error);
  });
}

function addSponsor() {
  const formData = new FormData(document.getElementById('addSponsorForm'));
  formData.append('tipFajla', 'image'); // Postavite tip fajla na 'image'
  console.log(formData);
  fetch('/upload-sponsor', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function previewPerson() {
  // Preuzmite podatke iz forme
  var ime = document.querySelector('[name="ime"]').value;
  var prezime = document.querySelector('[name="prezime"]').value;
  var opis = quill.root.innerHTML; // Pretpostavka da koristite Quill editor za opis

  // Preuzmite sliku kao Data URL
  var reader = new FileReader();
  reader.onload = function (e) {
    var slikaUrl = e.target.result;

    // Spremite podatke u localStorage
    localStorage.setItem('previewIme', ime);
    localStorage.setItem('previewPrezime', prezime);
    localStorage.setItem('previewOpis', opis);
    localStorage.setItem('previewSlikaUrl', slikaUrl);

    // Otvorite novu stranicu za pregled
    window.open('/preview.html', '_blank');
  };

  var slika = document.getElementById('slika').files[0];
  if (slika) {
    reader.readAsDataURL(slika);
  } else {
    // Ako nema slike, samo otvorite pregled
    window.open('/preview.html', '_blank');
  }
}

function removeSponsor() {
  var sponsorId = document.getElementById('sponsorSelect').value;
  console.log('sponsorId', sponsorId);
  fetch('/delete-sponsor', {
      method: 'POST', // ili 'DELETE', zavisi od vašeg API-ja
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: sponsorId }),
  })
  .then(response => response.json())
  .then(data => {
      console.log('Success:', data);
      // Ažurirajte UI ili prikažite poruku korisniku
      populateSponsorSelect(); // Ponovo učitajte sponzore nakon brisanja
  })
  .catch((error) => {
      console.error('Error:', error);
  });
}

function fetchSponsors() {
  fetch('/sponzori')
      .then(response => response.json())
      .then(data => {
          var select = document.getElementById('sponsorSelect');
          select.innerHTML = '';
          data.forEach(sponsor => {
              var option = document.createElement('option');
              option.value = sponsor.id;
              option.textContent = sponsor.link;
              select.appendChild(option);
          });
      })
      .catch(error => console.error('Error fetching sponsors:', error));
}

function submitAboutForm() {
  var aboutText = quillAbout.root.innerHTML; // Preuzmite sadržaj iz Quill editora

  fetch('/aboutus', {
    method: 'POST', // Metod zahtjeva
    headers: {
      'Content-Type': 'application/json', // Definiranje tipa sadržaja kao JSON
    },
    body: JSON.stringify({ text: aboutText }), // Slanje sadržaja kao JSON
  })
  .then(response => {
    if (response.ok) {
      return response.json(); // ili `response.text()` ako očekujete tekstualni odgovor
    }
    throw new Error('Network response was not ok.');
  })
  .then(data => {
    console.log(data); 
    // osvjezi ekran
    location.reload();
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
}