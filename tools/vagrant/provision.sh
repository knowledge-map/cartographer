apt-get update -y
apt-get install \
	git \
	build-essential \
	python-software-properties \
	-y

apt-add-repository ppa:chris-lea/node.js -y
apt-get install nodejs -y
