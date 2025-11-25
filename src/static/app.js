const API_BASE_URL = '';
let allProducts = [];
let allSuppliers = [];
let allStorages = [];

//Артикул (ID товара) - дополнить нулями до 8 символов
function formatArticle(id) {
    return String(id).padStart(8, '0');
}

// --- Helper functions ---

// Обработка ответов API
async function handleResponse(response, defaultErrorMsg) {
    if (!response.ok) {
        let errorMessage = defaultErrorMsg || 'Произошла неизвестная ошибка при выполнении запроса.';
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                if (Array.isArray(errorData.detail) && errorData.detail[0].loc) {
                    // Ошибка валидации Pydantic
                    const fieldName = errorData.detail[0].loc[1];
                    let errorMsg = errorData.detail[0].msg;
                    
                    // Перевод стандартных ошибок Pydantic на русский
                    if (errorMsg.includes('valid email address')) {
                        errorMsg = 'Некорректный формат email адреса';
                    }
                    
                    errorMessage = `Ошибка валидации поля "${fieldName}": ${errorMsg}`;
                } else if (typeof errorData.detail === 'string') {
                    // Стандартный HTTPException detail
                    errorMessage = errorData.detail;
                }
            }
        } catch (e) {
            // Игнорируем ошибки парсинга, используем сообщение по умолчанию
        }
        throw new Error(errorMessage);
    }
    // Если ответ ОК, возвращаем его JSON
    return response.json();
}

// Сброс фильтра дефицита
function resetDeficitFilter() {
    document.getElementById('deficitFilter').value = '';
    loadLeftovers();
}

// Показать сообщение
function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    
    messageArea.prepend(alertDiv);

    setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        bsAlert.close();
    }, 5000);
}

// --- Loading and Rendering Functions ---

async function loadProducts() {
    try {
        const supplierId = document.getElementById('supplierFilterSelect').value;
        let url = `${API_BASE_URL}/product`;
        if (supplierId && supplierId !== 'all') {
            //  отправляем числовой ID без ведущих нулей
            const numericSupplierId = parseInt(supplierId);
            url = `${API_BASE_URL}/supplier/supplied_products?supplier_id=${numericSupplierId}`;
        }
        const response = await fetch(url);
        allProducts = await handleResponse(response, 'Ошибка загрузки товаров');
        renderProductsTable(allProducts);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showMessage(`Не удалось загрузить товары: ${error.message}`, 'error');
    }
}

function renderProductsTable(data) {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Нет товаров для отображения.</td></tr>';
        return;
    }

    data.forEach(product => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = formatArticle(product.product_id);
        row.insertCell().textContent = product.product_name;
        row.insertCell().textContent = product.product_description || '';
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-info me-2" onclick="openEditProductModal(${product.product_id})">
                Изменить
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.product_id}, '${product.product_name}')">
                Удалить
            </button>
        `;
    });
}

async function loadSuppliers() {
    try {
        const response = await fetch(`${API_BASE_URL}/supplier`);
        allSuppliers = await handleResponse(response, 'Ошибка загрузки поставщиков');
        renderSuppliersTable(allSuppliers);
    } catch (error) {
        console.error('Ошибка загрузки поставщиков:', error);
        showMessage(`Не удалось загрузить поставщиков: ${error.message}`, 'error');
    }
}

function renderSuppliersTable(data) {
    const tableBody = document.getElementById('suppliersTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Нет поставщиков для отображения.</td></tr>';
        return;
    }

    data.forEach(supplier => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = supplier.supplier_id; 
        row.insertCell().textContent = supplier.supplier_name;
        row.insertCell().textContent = supplier.email || '';
        row.insertCell().textContent = supplier.phone;
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-info me-2" onclick="openEditSupplierModal(${supplier.supplier_id})">
                Изменить
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(${supplier.supplier_id}, '${supplier.supplier_name}')">
                Удалить
            </button>
        `;
    });
}

async function loadStorages() {
    try {
        const response = await fetch(`${API_BASE_URL}/storage`);
        allStorages = await handleResponse(response, 'Ошибка загрузки складов');
        renderStoragesTable(allStorages);
    } catch (error) {
        console.error('Ошибка загрузки складов:', error);
        showMessage(`Не удалось загрузить склады: ${error.message}`, 'error');
    }
}

function renderStoragesTable(data) {
    const tableBody = document.getElementById('storagesTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Нет складов для отображения.</td></tr>';
        return;
    }

    data.forEach(storage => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = storage.storage_id;
        row.insertCell().textContent = storage.storage_name;
        row.insertCell().textContent = storage.address || '';
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-info me-2" onclick="openEditStorageModal(${storage.storage_id})">
                Изменить
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteStorage(${storage.storage_id}, '${storage.storage_name}')">
                Удалить
            </button>
        `;
    });
}

async function loadLeftovers() {
    try {
        const deficitValue = document.getElementById('deficitFilter').value;
        let url = `${API_BASE_URL}/storage/leftovers`;
        if (deficitValue && !isNaN(parseInt(deficitValue)) && parseInt(deficitValue) >= 1) {
            url += `?num=${parseInt(deficitValue)}`;
        }
        
        const response = await fetch(url);
        const leftovers = await handleResponse(response, 'Ошибка загрузки остатков');
        renderLeftoversTable(leftovers);
    } catch (error) {
        console.error('Ошибка загрузки остатков:', error);
        showMessage(`Не удалось загрузить остатки: ${error.message}`, 'error');
    }
}

function renderLeftoversTable(data) {
    const tableBody = document.getElementById('leftoversTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Нет остатков для отображения.</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = formatArticle(item.product_id);
        row.insertCell().textContent = item.product_name;
        row.insertCell().textContent = item.storage_name;
        const leftoverCell = row.insertCell();
        leftoverCell.textContent = item.leftover;
        if (item.leftover === 0) {
            leftoverCell.classList.add('text-danger', 'fw-bold');
        }
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-info me-2" 
                    onclick="openEditLeftoverModal(${item.product_id}, ${item.storage_id}, ${item.leftover})">
                Изменить
            </button>
            <button class="btn btn-sm btn-outline-danger" 
                    onclick="deleteLeftover(${item.product_id}, ${item.storage_id}, '${item.product_name}')">
                Удалить
            </button>
        `;
    });
}

async function loadProductsWithSuppliers() {
    try {
        const response = await fetch(`${API_BASE_URL}/supplier/with_products`);
        const data = await handleResponse(response, 'Ошибка загрузки связей "Товар - Поставщик"');
        renderProductsWithSuppliersTable(data);
    } catch (error) {
        console.error('Ошибка загрузки связей "Товар - Поставщик":', error);
        showMessage(`Не удалось загрузить связи "Товар - Поставщик": ${error.message}`, 'error');
    }
}

function renderProductsWithSuppliersTable(data) {
    const tableBody = document.getElementById('productsSuppliersTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Нет зарегистрированных связей "Товар - Поставщик".</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tableBody.insertRow();
        
        row.insertCell().textContent = item.product_name; 
        row.insertCell().textContent = item.supplier_name; 
        row.insertCell().textContent = item.phone || '-';
        row.insertCell().innerHTML = item.email ? `<a href="mailto:${item.email}">${item.email}</a>` : '-';
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-danger" 
                    onclick="deleteSupply(${item.product_id}, ${item.supplier_id}, '${item.product_name}', '${item.supplier_name}')">
                Удалить поставку
            </button>
        `;
    });
}

async function populateDropdowns() {
    const purchaseProductSelect = document.getElementById('purchaseProduct');
    const supplyProductSelect = document.getElementById('supplyProduct');
    const supplySupplierSelect = document.getElementById('supplySupplierSelect');
    const supplierFilterSelect = document.getElementById('supplierFilterSelect');
    
    // Очистка перед заполнением
    purchaseProductSelect.innerHTML = '<option value="">Выберите товар</option>';
    supplyProductSelect.innerHTML = '<option value="">Выберите товар</option>';
    supplySupplierSelect.innerHTML = '<option value="">Выберите поставщика</option>';
    supplierFilterSelect.innerHTML = '<option value="all">Показать все товары</option>';

    try {
        const [productsResponse, suppliersResponse, storagesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/product`),
            fetch(`${API_BASE_URL}/supplier`),
            fetch(`${API_BASE_URL}/storage`),
        ]);

        allProducts = await handleResponse(productsResponse, 'Ошибка загрузки товаров для выпадающего списка');
        const suppliers = await handleResponse(suppliersResponse, 'Ошибка загрузки поставщиков для выпадающего списка');
        const storages = await handleResponse(storagesResponse, 'Ошибка загрузки складов для выпадающего списка');
        
        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.product_id;
            option.textContent = product.product_name;
            supplyProductSelect.appendChild(option.cloneNode(true));
            purchaseProductSelect.appendChild(option.cloneNode(true)); 
        });
        
        suppliers.forEach(supplier => {
            let optionSupply = document.createElement('option');
            optionSupply.value = supplier.supplier_id;
            optionSupply.textContent = supplier.supplier_name;
            supplySupplierSelect.appendChild(optionSupply.cloneNode(true));

            let optionFilter = document.createElement('option');
            optionFilter.value = supplier.supplier_id;
            optionFilter.textContent = supplier.supplier_name;
            supplierFilterSelect.appendChild(optionFilter);
        });

        // Для закупок
        const purchaseStorageSelect = document.getElementById('purchaseStorage');
        
        purchaseStorageSelect.innerHTML = '<option value="">Выберите склад</option>';
        
        storages.forEach(storage => {
            const option = document.createElement('option');
            option.value = storage.storage_id;
            option.textContent = storage.storage_name;
            purchaseStorageSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Ошибка заполнения выпадающих списков:', error);
        showMessage(`Не удалось загрузить данные для выпадающих списков: ${error.message}`, 'error');
    }
}

// --- CRUD Actions ---

// Продукты
document.getElementById('addProductForm').addEventListener('submit', addProduct);
document.getElementById('editProductForm').addEventListener('submit', editProduct);

async function addProduct(event) {
    event.preventDefault();
    const productData = {
        product_name: document.getElementById('productName').value,
        product_description: document.getElementById('productDescription').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });
        const result = await handleResponse(response, 'Ошибка добавления товара');
        showMessage(`Товар "${productData.product_name}" успешно добавлен с артикулом ${formatArticle(result.id)}!`, 'success');
        
        // Сброс формы и закрытие модального окна
        document.getElementById('addProductForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();

        await Promise.all([loadProducts(), populateDropdowns(), loadProductsWithSuppliers()]);
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        showMessage(`Ошибка добавления товара: ${error.message}`, 'error');
    }
}

function openEditProductModal(productId) {
    const product = allProducts.find(p => p.product_id === productId);
    if (!product) return showMessage('Товар не найден.', 'error');

    document.getElementById('editProductId').value = product.product_id;
    document.getElementById('editProductArticle').value = formatArticle(product.product_id);
    document.getElementById('editProductName').value = product.product_name;
    document.getElementById('editProductDescription').value = product.product_description || '';

    const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    editModal.show();
}

async function editProduct(event) {
    event.preventDefault();
    const productData = {
        product_id: parseInt(document.getElementById('editProductId').value),
        product_name: document.getElementById('editProductName').value,
        product_description: document.getElementById('editProductDescription').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/product`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });
        await handleResponse(response, 'Ошибка изменения товара');
        showMessage(`Товар "${productData.product_name}" успешно изменен!`, 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        await Promise.all([loadProducts(), populateDropdowns(), loadProductsWithSuppliers(), loadLeftovers()]);
    } catch (error) {
        console.error('Ошибка изменения товара:', error);
        showMessage(`Ошибка изменения товара: ${error.message}`, 'error');
    }
}

async function deleteProduct(id, name) {
    if (!confirm(`Вы уверены, что хотите удалить товар "${name}" (Артикул: ${formatArticle(id)})?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/product?id=${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Ошибка удаления товара');
        showMessage('Товар успешно удален!', 'success');
        await Promise.all([loadProducts(), populateDropdowns(), loadProductsWithSuppliers(), loadLeftovers()]);
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showMessage(`Ошибка удаления товара: ${error.message}`, 'error');
    }
}

// Поставщики
document.getElementById('addSupplierForm').addEventListener('submit', addSupplier);
document.getElementById('editSupplierForm').addEventListener('submit', editSupplier);

async function addSupplier(event) {
    event.preventDefault();
    const supplierData = {
        supplier_name: document.getElementById('supplierName').value,
        email: document.getElementById('supplierEmail').value || null,
        phone: document.getElementById('supplierPhone').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/supplier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierData),
        });
        const result = await handleResponse(response, 'Ошибка добавления поставщика');
        showMessage(`Поставщик "${supplierData.supplier_name}" успешно добавлен! (ID: ${result.id})`, 'success');
        
        document.getElementById('addSupplierForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide();

        await Promise.all([loadSuppliers(), populateDropdowns()]);
    } catch (error) {
        console.error('Ошибка добавления поставщика:', error);
        showMessage(`Ошибка добавления поставщика: ${error.message}`, 'error');
    }
}

function openEditSupplierModal(supplierId) {
    const supplier = allSuppliers.find(s => s.supplier_id === supplierId);
    if (!supplier) return showMessage('Поставщик не найден.', 'error');

    document.getElementById('editSupplierId').value = supplier.supplier_id;
    document.getElementById('editSupplierDisplayId').value = supplier.supplier_id; 
    document.getElementById('editSupplierName').value = supplier.supplier_name;
    document.getElementById('editSupplierEmail').value = supplier.email || '';
    document.getElementById('editSupplierPhone').value = supplier.phone;

    const editModal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
    editModal.show();
}

async function editSupplier(event) {
    event.preventDefault();
    const supplierData = {
        supplier_id: parseInt(document.getElementById('editSupplierId').value),
        supplier_name: document.getElementById('editSupplierName').value,
        email: document.getElementById('editSupplierEmail').value || null,
        phone: document.getElementById('editSupplierPhone').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/supplier`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierData),
        });
        await handleResponse(response, 'Ошибка изменения поставщика');
        showMessage(`Поставщик "${supplierData.supplier_name}" успешно изменен!`, 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
        await Promise.all([loadSuppliers(), populateDropdowns(), loadProductsWithSuppliers()]);
    } catch (error) {
        console.error('Ошибка изменения поставщика:', error);
        showMessage(`Ошибка изменения поставщика: ${error.message}`, 'error');
    }
}

async function deleteSupplier(id, name) {
    if (!confirm(`Вы уверены, что хотите удалить поставщика "${name}" (ID: ${id})?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/supplier?id=${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Ошибка удаления поставщика');
        showMessage('Поставщик успешно удален!', 'success');
        await Promise.all([loadSuppliers(), populateDropdowns(), loadProductsWithSuppliers()]);
    } catch (error) {
        console.error('Ошибка удаления поставщика:', error);
        showMessage(`Ошибка удаления поставщика: ${error.message}`, 'error');
    }
}

// Склады
document.getElementById('addStorageForm').addEventListener('submit', addStorage);
document.getElementById('editStorageForm').addEventListener('submit', editStorage);

async function addStorage(event) {
    event.preventDefault();
    const storageData = {
        storage_name: document.getElementById('storageName').value,
        address: document.getElementById('storageAddress').value || null,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/storage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storageData),
        });
        const result = await handleResponse(response, 'Ошибка добавления склада');
        showMessage(`Склад "${storageData.storage_name}" успешно добавлен! (ID: ${result.id})`, 'success');
        
        document.getElementById('addStorageForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addStorageModal')).hide();

        await Promise.all([loadStorages(), populateDropdowns(), loadLeftovers()]);
    } catch (error) {
        console.error('Ошибка добавления склада:', error);
        showMessage(`Ошибка добавления склада: ${error.message}`, 'error');
    }
}

function openEditStorageModal(storageId) {
    const storage = allStorages.find(s => s.storage_id === storageId);
    if (!storage) return showMessage('Склад не найден.', 'error');

    document.getElementById('editStorageId').value = storage.storage_id;
    document.getElementById('editStorageDisplayId').value = storage.storage_id;
    document.getElementById('editStorageName').value = storage.storage_name;
    document.getElementById('editStorageAddress').value = storage.address || '';

    const editModal = new bootstrap.Modal(document.getElementById('editStorageModal'));
    editModal.show();
}

async function editStorage(event) {
    event.preventDefault();
    const storageData = {
        storage_id: parseInt(document.getElementById('editStorageId').value),
        storage_name: document.getElementById('editStorageName').value,
        address: document.getElementById('editStorageAddress').value || null,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/storage`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storageData),
        });
        await handleResponse(response, 'Ошибка изменения склада');
        showMessage(`Склад "${storageData.storage_name}" успешно изменен!`, 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editStorageModal')).hide();
        await Promise.all([loadStorages(), loadLeftovers()]);
    } catch (error) {
        console.error('Ошибка изменения склада:', error);
        showMessage(`Ошибка изменения склада: ${error.message}`, 'error');
    }
}

async function deleteStorage(id, name) {
    if (!confirm(`Вы уверены, что хотите удалить склад "${name}" (ID: ${id})?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/storage?id=${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Ошибка удаления склада');
        showMessage('Склад успешно удален!', 'success');
        await Promise.all([loadStorages(), populateDropdowns(), loadLeftovers()]);
    } catch (error) {
        console.error('Ошибка удаления склада:', error);
        showMessage(`Ошибка удаления склада: ${error.message}`, 'error');
    }
}

// Закупки (Остатки на складах)
document.getElementById('addPurchaseForm').addEventListener('submit', addPurchase);
document.getElementById('editLeftoverForm').addEventListener('submit', editLeftover);

async function addPurchase(event) {
    event.preventDefault();
    const purchaseData = {
        product_id: parseInt(document.getElementById('purchaseProduct').value),
        storage_id: parseInt(document.getElementById('purchaseStorage').value),
        leftover: parseInt(document.getElementById('purchaseQuantity').value),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData),
        });
        await handleResponse(response, 'Ошибка добавления закупки');
        showMessage(`Закупка успешно добавлена (Кол-во: ${purchaseData.leftover})!`, 'success');
        
        document.getElementById('addPurchaseForm').reset();
        await loadLeftovers();
    } catch (error) {
        console.error('Ошибка добавления закупки:', error);
        showMessage(`Ошибка добавления закупки: ${error.message}`, 'error');
    }
}

function openEditLeftoverModal(productId, storageId, quantity) {
    document.getElementById('editLeftoverProductId').value = productId;
    document.getElementById('editLeftoverOriginalProductId').value = productId;
    document.getElementById('editLeftoverStorageId').value = storageId;
    document.getElementById('editLeftoverOriginalStorageId').value = storageId;
    document.getElementById('editLeftoverQuantity').value = quantity;
    
    const editModal = new bootstrap.Modal(document.getElementById('editLeftoverModal'));
    editModal.show();
}

async function editLeftover(event) {
    event.preventDefault();
    const productIdValue = document.getElementById('editLeftoverProductId').value;
    const storageIdValue = document.getElementById('editLeftoverStorageId').value;
    const quantityValue = document.getElementById('editLeftoverQuantity').value;
    
    const purchase = {
        product_id: parseInt(productIdValue),
        storage_id: parseInt(storageIdValue),
        leftover: parseInt(quantityValue),
    }

    if (isNaN(purchase.product_id) || isNaN(purchase.storage_id) || isNaN(purchase.leftover)) {
        showMessage('Ошибка: Не удалось распознать ID товара, ID склада или количество.', 'error');
        return;
    }

    if(purchase.leftover < 0) {
        showMessage('Ошибка: Остаток не может быть отрицательным.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/purchase`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchase),
        });
        await handleResponse(response, 'Ошибка изменения остатка');
        showMessage('Остаток успешно обновлен!', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editLeftoverModal')).hide();
        await loadLeftovers();
    } catch (error) {
        console.error('Ошибка изменения остатка:', error);
        showMessage(`Ошибка изменения остатка: ${error.message}`, 'error');
    }
}

// Удаление Закупки (Остатков)
async function deleteLeftover(productId, storageId, productName) {
    const productArticle = formatArticle(productId);
    // Получаем имя склада для подтверждения (предполагаем, что allStorages загружен)
    const storage = allStorages.find(s => s.storage_id === storageId);
    const storageName = storage ? storage.storage_name : `Склад ID ${storageId}`;

    if (!confirm(`Вы уверены, что хотите удалить запись об остатках (Закупку) для товара "${productName}" (Артикул: ${productArticle}) со склада "${storageName}"? Это приведет к обнулению остатка.`)) return;

    try {
        // DELETE /purchase?product_id=X&storage_id=Y
        const response = await fetch(`${API_BASE_URL}/purchase?product_id=${productId}&storage_id=${storageId}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Ошибка удаления записи об остатках');
        showMessage(`Запись об остатках для товара "${productName}" со склада "${storageName}" успешно удалена! (Остаток обнулен)`, 'success');
        await loadLeftovers(); // Обновление таблицы
    } catch (error) {
        console.error('Ошибка удаления остатка:', error);
        showMessage(`Ошибка удаления остатка: ${error.message}`, 'error');
    }
}


// Поставки (связь Товар-Поставщик)
document.getElementById('addSupplyForm').addEventListener('submit', addSupply);

async function addSupply(event) {
    event.preventDefault();
    const supplyData = {
        product_id: parseInt(document.getElementById('supplyProduct').value),
        supplier_id: parseInt(document.getElementById('supplySupplierSelect').value),
    };

    try {
        const response = await fetch(`${API_BASE_URL}/supply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplyData),
        });
        await handleResponse(response, 'Ошибка добавления поставки');
        showMessage('Поставка успешно добавлена!', 'success');
        
        document.getElementById('addSupplyForm').reset();
        await loadProductsWithSuppliers();
    } catch (error) {
        console.error('Ошибка добавления поставки:', error);
        showMessage(`Ошибка добавления поставки: ${error.message}`, 'error');
    }
}

// Удаление Поставки (связь Товар-Поставщик)
async function deleteSupply(productId, supplierId, productName, supplierName) {
    if (!confirm(`Вы уверены, что хотите удалить поставку для товара "${productName}" от поставщика "${supplierName}"?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/supply?product_id=${productId}&supplier_id=${supplierId}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Ошибка удаления поставки');
        showMessage('Поставка успешно удалена!', 'success');
        await loadProductsWithSuppliers(); // Обновление таблицы
    } catch (error) {
        console.error('Ошибка удаления поставки:', error);
        showMessage(`Ошибка удаления поставки: ${error.message}`, 'error');
    }
}

// --- Initialization ---

function init() {
    // Загрузка данных для всех таблиц и списков при старте
    loadProducts();
    loadSuppliers();
    loadStorages();
    loadLeftovers();
    loadProductsWithSuppliers();
    populateDropdowns();

    // При смене вкладки, принудительно обновляем данные для активной вкладки
    document.getElementById('mainTabs').addEventListener('shown.bs.tab', function (e) {
        const targetId = e.target.getAttribute('href');
        switch(targetId) {
            case '#nomenclature':
                loadProducts();
                break;
            case '#suppliers':
                loadSuppliers();
                break;
            case '#storages':
                loadStorages();
                break;
            case '#leftovers':
                loadLeftovers();
                break;
            case '#products-suppliers':
                loadProductsWithSuppliers();
                break;
        }
    });

    // Обновляем список товаров при смене фильтра
    document.getElementById('supplierFilterSelect').addEventListener('change', loadProducts);
}

window.onload = init;