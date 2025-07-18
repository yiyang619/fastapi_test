document.getElementById('dataForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const runBtn = document.getElementById('runBtn');
    const statusMessage = document.getElementById('statusMessage');

    // 获取表单数据
    const formData = {
        text_param: document.getElementById('textParam').value,
        date_param: document.getElementById('dateParam').value,
        number_param: parseFloat(document.getElementById('numberParam').value)
    };

    // 验证数据
    if (!formData.text_param || !formData.date_param || isNaN(formData.number_param)) {
        showStatus('请填写所有字段', 'danger');
        return;
    }

    try {
        // 设置按钮状态
        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 处理中...';
        statusMessage.style.display = 'none';

        // 发送请求到后端
        const response = await fetch('/run-program', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 显示成功消息
            showStatus('分析完成！', 'success');

            // 填充参数表格
            fillParamTable(data.parameters);

            // 填充结果表格
            fillResultTable(data.results);

            // 显示生成的图片
            displayGeneratedImage(data.image_data);
        } else {
            throw new Error(data.message || '分析过程中出现错误');
        }
    } catch (error) {
        showStatus(`错误: ${error.message}`, 'danger');
        console.error('Error:', error);
    } finally {
        // 恢复按钮状态
        runBtn.disabled = false;
        runBtn.textContent = '运行分析';
    }
});

function showStatus(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message alert alert-${type}`;
    statusMessage.style.display = 'block';
}

function fillParamTable(parameters) {
    const tbody = document.querySelector('#paramTable tbody');
    tbody.innerHTML = '';

    for (const [key, value] of Object.entries(parameters)) {
        const row = document.createElement('tr');

        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        row.appendChild(keyCell);

        const valueCell = document.createElement('td');
        valueCell.textContent = value;
        row.appendChild(valueCell);

        tbody.appendChild(row);
    }
}

function fillResultTable(results) {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    results.forEach(item => {
        const row = document.createElement('tr');

        ['id', 'name', 'value', 'date'].forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = item[key];
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

function displayGeneratedImage(responseData) {
    const imgElement = document.getElementById('generatedImage');

    // 调试输出完整响应
    console.log("完整响应数据:", responseData);

    // 检查数据是否存在
    if (!responseData || !responseData.image_data) {
        console.error("错误: 响应中缺少image_data字段", responseData);
        showStatus('服务器未返回图表数据', 'danger');
        return;
    }

    const imageData = responseData.image_data;

    // 验证数据格式
    if (!imageData.startsWith('data:image/png;base64,')) {
        console.error("错误: 数据格式不正确", {
            received: imageData.substring(0, 50) + '...',
            expected: 'data:image/png;base64,...'
        });
        showStatus('图表数据格式错误', 'danger');
        return;
    }

    // 测试图片数据是否有效
    const testImg = new Image();
    testImg.onload = function() {
        imgElement.src = imageData;
        imgElement.style.display = 'block';
        showStatus('图表加载成功', 'success');
    };
    testImg.onerror = function() {
        console.error("Base64数据解码失败");
        showStatus('图表数据损坏', 'danger');
    };
    testImg.src = imageData;
}