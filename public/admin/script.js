document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('userTableBody')) {
        await loadUsers();
    }

    if (document.getElementById('addUserForm')) {
        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            await fetch('/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            window.location.href = 'index.html';
        });
    }

    if (document.getElementById('editUserForm')) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        const user = await fetch(`/users/${userId}`).then(res => res.json());

        document.getElementById('userId').value = user._id;
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('userId').value;
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            await fetch(`/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            window.location.href = 'index.html';
        });
    }
});

async function loadUsers() {
    const users = await fetch('/users').then(res => res.json());
    const userTableBody = document.getElementById('userTableBody');
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <a href="edit-user.html?id=${user._id}">Edit</a>
                <button onclick="deleteUser('${user._id}')">Delete</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        await fetch(`/users/${id}`, {
            method: 'DELETE'
        });
        window.location.reload();
    }
}