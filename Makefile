PROTO_FILES:=$(shell find proto -iname "*.proto")
UID:=$(shell id -u)
GID:=$(shell id -g)

grpc-generate:

	@rm -rf generated
	@mkdir -p build
	@docker run --rm -v `pwd`:/src -w /src -u $(UID):$(GID) quangtm210395/protobuf \
		--plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
		-I./proto \
		--js_out=import_style=commonjs,binary:generated \
		$(PROTO_FILES)
	@docker run --rm -v `pwd`:/src -w /src -u $(UID):$(GID) quangtm210395/protobuf \
		--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts -I./proto \
		--ts_out=generated \
		$(PROTO_FILES)
	rm -rf src/google
	mkdir src/google
	cp -r generated/* src/google
	npm run clean-build
	cp -r build/* dist
	rm -rf build


# protoc --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin -I proto --js_out=import_style=commonjs,binary:./dist ./proto/*/*.proto && protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts -I proto --ts_out=./dist ./proto/*/*.proto