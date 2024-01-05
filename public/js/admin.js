document.addEventListener('DOMContentLoaded', function() {
  fetchEntryStats();
  
});


document.addEventListener('DOMContentLoaded', function() {
  fetch('/get-role')
    .then(response => response.json())
    .then(data => {
      var manageModsTab = document.getElementById('ManageModerators1');
      if (data.role === 'admin') {
        manageModsTab.style.display = 'block';
      } else {
        manageModsTab.style.display = 'none';
      }
    })
    .catch(error => console.error('Error fetching role:', error));

    fetchModerators();
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
    alert('Istaknute osobe su uspješno odabrane!');
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
            const listItem = document.createElement('li');
            listItem.textContent = `IP Address: ${entry.ip}, Login Time: ${entry.loginTime}`;
            ipList.appendChild(listItem);
          });
        })
        .catch(error => console.error(error));
    }

    // Fetch IP addresses on page load
    fetchUserIPs();
  
    function uploadMedia() {
  const typeSelect = document.getElementById('type');
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
    alert('Fajl uspešno uploadovan i dodat u bazu podataka.');
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
        alert('Osoba mjeseca je uspješno odabrana!');
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
document.getElementById('delete-button').addEventListener('click', () => {
  const checkedBoxes = document.querySelectorAll('.person-checkbox:checked');
  const idsToDelete = Array.from(checkedBoxes).map(box => box.value);

  fetch('/admin/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: idsToDelete })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.message);
    
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
  var reader = new FileReader();
  reader.onload = function() {
    var image = document.getElementById('imagePreview');
    image.src = reader.result;
    image.style.display = 'block';
    document.querySelector('.image-upload-box p').style.display = 'none'; // Hide the 'Upload Picture' text
  };
  reader.readAsDataURL(event.target.files[0]);
}
function updateFilename() {
  var fileInput = document.getElementById('file');
  var fileName = fileInput.files[0].name;
  document.getElementById('file-name').textContent = fileName; // Update the placeholder with the file name
}

let searchTimeoutToken;

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
function populateEditForm() {
  const personId = document.getElementById('personSelect').value;
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
        document.getElementById('datumRodjenjaEdit').value = data.datumRodjenja;
        document.getElementById('mjestoRodjenjaEdit').value = data.mjestoRodjenja;
        document.getElementById('datumSmrtiEdit').value = data.datumSmrti || '';

        if (data.slikaUrl) {
          let path = 'uploads/media/images/' + data.slikaUrl;
          const imagePreview = document.getElementById('slikaId');
          imagePreview.src = path;
          imagePreview.style.display = 'block';
        }

        // Destroy existing CKEditor instance if it exists
        if (window.editorInstance) {
          window.editorInstance.destroy()
            .then(() => {
              createEditor(data.opis);
            })
            .catch(error => {
              console.error('Error destroying the CKEditor:', error);
            });
        } else {
          createEditor(data.opis);
        }
      })
      .catch(error => {
        console.error('Failed to fetch person details:', error);
        document.getElementById('editPersonForm').style.display = 'none';
      });
  } else {
    document.getElementById('editPersonForm').style.display = 'none';
  }
}

function createEditor(data) {
  ClassicEditor
    .create(document.querySelector('#opisEdit'))
    .then(editor => {
      window.editorInstance = editor;
      editor.setData(data);
    })
    .catch(error => {
      console.error('Error initializing the CKEditor:', error);
    });
}

function submitEditForm() {
  const personId = document.getElementById('personSelect').value;
  if (!personId) {
    alert('No person selected.');
    return;
  }
  console.log(personId);
  if (window.editorInstance) {
    const opisEditData = window.editorInstance.getData();
    document.getElementById('opisEdit').value = opisEditData;
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
    alert('Person updated successfully');
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to update the person');
  });
}


function addModerator() {
  const username = document.getElementById('modUsername').value;
  const password = document.getElementById('modPassword').value;

  fetch('/admin/addModerator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    alert('Moderator je uspješno dodan');
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
    alert('Moderator je obrisan');
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
    
    // Call this function when the admin page loads
    