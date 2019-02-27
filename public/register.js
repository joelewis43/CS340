function toggleAccType(){
	var accType = document.querySelector('input[name = accType]:checked').value;
	document.getElementById('customerRegContainer').style.display = (accType == "customer") ? 'block' : 'none';
	document.getElementById('vendorRegContainer').style.display = (accType == "vendor") ? 'block' : 'none';
}
